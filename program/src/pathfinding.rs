use std::collections::{BinaryHeap, HashMap, HashSet};
use std::cmp::Ordering;
use solana_program::pubkey::Pubkey;

use crate::state::{PoolInfo, MAX_ROUTE_HOPS};
use crate::error::WayfinderError;

#[derive(Clone, Debug)]
struct PathNode {
    token: Pubkey,
    cost: u64, // Negative of amount out (to maximize output)
    hops: u8,
    path: Vec<Pubkey>, // Pool addresses
    amount_out: u64,
}

impl PartialEq for PathNode {
    fn eq(&self, other: &Self) -> bool {
        self.cost == other.cost
    }
}

impl Eq for PathNode {}

impl PartialOrd for PathNode {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for PathNode {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse ordering for min-heap behavior (maximize amount_out)
        other.cost.cmp(&self.cost)
            .then_with(|| self.hops.cmp(&other.hops))
    }
}

pub struct AStarPathfinder<'a> {
    pools: &'a [PoolInfo],
    max_hops: u8,
}

impl<'a> AStarPathfinder<'a> {
    pub fn new(pools: &'a [PoolInfo], max_hops: u8) -> Self {
        Self {
            pools,
            max_hops: max_hops.min(MAX_ROUTE_HOPS as u8),
        }
    }

    /// Find optimal route using A* algorithm
    /// Returns (route_pools, final_amount_out)
    pub fn find_optimal_route(
        &self,
        input_mint: &Pubkey,
        output_mint: &Pubkey,
        amount_in: u64,
    ) -> Result<(Vec<Pubkey>, u64), WayfinderError> {
        if input_mint == output_mint {
            return Err(WayfinderError::InvalidRoute);
        }

        let mut open_set = BinaryHeap::new();
        let mut visited: HashSet<Pubkey> = HashSet::new();
        let mut best_routes: HashMap<Pubkey, (u64, u8)> = HashMap::new();

        // Initialize with starting token
        open_set.push(PathNode {
            token: *input_mint,
            cost: 0,
            hops: 0,
            path: Vec::new(),
            amount_out: amount_in,
        });
        best_routes.insert(*input_mint, (amount_in, 0));

        let mut best_solution: Option<(Vec<Pubkey>, u64)> = None;

        while let Some(current) = open_set.pop() {
            // Skip if we've found a better path to this token
            if let Some(&(best_amount, best_hops)) = best_routes.get(&current.token) {
                if current.amount_out < best_amount || 
                   (current.amount_out == best_amount && current.hops > best_hops) {
                    continue;
                }
            }

            // Check if we reached the destination
            if current.token == *output_mint {
                match &best_solution {
                    None => best_solution = Some((current.path.clone(), current.amount_out)),
                    Some((_, best_amount)) => {
                        if current.amount_out > *best_amount {
                            best_solution = Some((current.path.clone(), current.amount_out));
                        }
                    }
                }
                continue;
            }

            // Don't expand if we've hit max hops
            if current.hops >= self.max_hops {
                continue;
            }

            // Mark as visited
            visited.insert(current.token);

            // Explore neighbors (pools connected to current token)
            for pool in self.pools.iter() {
                // Check if pool involves current token
                let next_token = match pool.get_other_token(&current.token) {
                    Some(t) => t,
                    None => continue,
                };

                // Skip if we've already visited this token (prevent cycles)
                if visited.contains(&next_token) {
                    continue;
                }

                // Calculate output amount through this pool
                let amount_out = match pool.get_output_amount(&current.token, current.amount_out) {
                    Some(amt) => amt,
                    None => continue,
                };

                if amount_out == 0 {
                    continue;
                }

                // Check if this is a better route to next_token
                let should_explore = match best_routes.get(&next_token) {
                    None => true,
                    Some(&(best_amount, best_hops)) => {
                        amount_out > best_amount || 
                        (amount_out == best_amount && current.hops + 1 < best_hops)
                    }
                };

                if should_explore {
                    best_routes.insert(next_token, (amount_out, current.hops + 1));
                    
                    let mut new_path = current.path.clone();
                    new_path.push(pool.address);

                    // Cost is negated amount_out to maximize output in min-heap
                    let cost = u64::MAX - amount_out;

                    open_set.push(PathNode {
                        token: next_token,
                        cost,
                        hops: current.hops + 1,
                        path: new_path,
                        amount_out,
                    });
                }
            }
        }

        best_solution.ok_or(WayfinderError::NoValidPath)
    }

    /// Heuristic function for A* (estimates remaining cost)
    /// In swap routing, we estimate the best possible rate
    fn _heuristic(&self, from_token: &Pubkey, to_token: &Pubkey, amount: u64) -> u64 {
        // Find best direct rate if exists
        let mut best_rate = 0u64;
        
        for pool in self.pools.iter() {
            if (pool.token_a == *from_token && pool.token_b == *to_token) ||
               (pool.token_b == *from_token && pool.token_a == *to_token) {
                if let Some(out) = pool.get_output_amount(from_token, amount) {
                    best_rate = best_rate.max(out);
                }
            }
        }
        
        // Return negated for min-heap
        u64::MAX - best_rate
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pathfinding_direct_route() {
        let token_a = Pubkey::new_unique();
        let token_b = Pubkey::new_unique();
        let pool_addr = Pubkey::new_unique();

        let pools = vec![
            PoolInfo {
                address: pool_addr,
                token_a,
                token_b,
                fee_bps: 30,
                reserve_a: 1_000_000,
                reserve_b: 2_000_000,
            }
        ];

        let pathfinder = AStarPathfinder::new(&pools, 3);
        let result = pathfinder.find_optimal_route(&token_a, &token_b, 1000);
        
        assert!(result.is_ok());
        let (route, amount_out) = result.unwrap();
        assert_eq!(route.len(), 1);
        assert_eq!(route[0], pool_addr);
        assert!(amount_out > 0);
    }

    #[test]
    fn test_pathfinding_multi_hop() {
        let token_a = Pubkey::new_unique();
        let token_b = Pubkey::new_unique();
        let token_c = Pubkey::new_unique();
        let pool1 = Pubkey::new_unique();
        let pool2 = Pubkey::new_unique();

        let pools = vec![
            PoolInfo {
                address: pool1,
                token_a,
                token_b,
                fee_bps: 30,
                reserve_a: 1_000_000,
                reserve_b: 1_000_000,
            },
            PoolInfo {
                address: pool2,
                token_a: token_b,
                token_b: token_c,
                fee_bps: 30,
                reserve_a: 1_000_000,
                reserve_b: 1_000_000,
            }
        ];

        let pathfinder = AStarPathfinder::new(&pools, 3);
        let result = pathfinder.find_optimal_route(&token_a, &token_c, 1000);
        
        assert!(result.is_ok());
        let (route, _) = result.unwrap();
        assert_eq!(route.len(), 2);
    }
}

