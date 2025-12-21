use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

pub const MAX_ROUTE_HOPS: usize = 5;
pub const ROUTE_STATE_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1 + (MAX_ROUTE_HOPS * 32) + 1 + 32;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct RouteState {
    /// Discriminator for account type
    pub discriminator: u8,
    
    /// Input token mint
    pub input_mint: Pubkey,
    
    /// Output token mint
    pub output_mint: Pubkey,
    
    /// Input amount
    pub amount_in: u64,
    
    /// Minimum output amount
    pub min_amount_out: u64,
    
    /// Number of hops in the route
    pub hops: u8,
    
    /// Route path (pool pubkeys)
    pub route: Vec<Pubkey>,
    
    /// Route status: 0 = uninitialized, 1 = initialized, 2 = route_found, 3 = executed
    pub status: u8,
    
    /// Authority
    pub authority: Pubkey,
}

impl RouteState {
    pub const LEN: usize = ROUTE_STATE_SIZE;
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq, Eq)]
pub struct PoolInfo {
    /// Pool account address
    pub address: Pubkey,
    
    /// Token A mint
    pub token_a: Pubkey,
    
    /// Token B mint
    pub token_b: Pubkey,
    
    /// Fee in basis points (1 bps = 0.01%)
    pub fee_bps: u16,
    
    /// Token A reserve
    pub reserve_a: u64,
    
    /// Token B reserve
    pub reserve_b: u64,
}

impl PoolInfo {
    pub fn get_output_amount(&self, input_mint: &Pubkey, amount_in: u64) -> Option<u64> {
        let (reserve_in, reserve_out) = if input_mint == &self.token_a {
            (self.reserve_a, self.reserve_b)
        } else if input_mint == &self.token_b {
            (self.reserve_b, self.reserve_a)
        } else {
            return None;
        };

        // Calculate output with fee: (amount_in * (10000 - fee_bps) * reserve_out) / (reserve_in * 10000 + amount_in * (10000 - fee_bps))
        let amount_in_with_fee = (amount_in as u128)
            .checked_mul((10000u128).checked_sub(self.fee_bps as u128)?)?;
        
        let numerator = amount_in_with_fee.checked_mul(reserve_out as u128)?;
        let denominator = (reserve_in as u128)
            .checked_mul(10000u128)?
            .checked_add(amount_in_with_fee)?;
        
        Some((numerator / denominator) as u64)
    }

    pub fn get_other_token(&self, token: &Pubkey) -> Option<Pubkey> {
        if token == &self.token_a {
            Some(self.token_b)
        } else if token == &self.token_b {
            Some(self.token_a)
        } else {
            None
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct PoolRegistry {
    /// Discriminator
    pub discriminator: u8,
    
    /// Authority
    pub authority: Pubkey,
    
    /// Registered pools
    pub pools: Vec<PoolInfo>,
}

