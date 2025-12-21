import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PoolInfo } from './types';

interface PathNode {
  token: PublicKey;
  cost: BN;
  hops: number;
  path: PublicKey[];
  amountOut: BN;
}

export class AStarPathfinder {
  private pools: PoolInfo[];
  private maxHops: number;

  constructor(pools: PoolInfo[], maxHops: number = 3) {
    this.pools = pools;
    this.maxHops = Math.min(maxHops, 5);
  }

  findOptimalRoute(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amountIn: BN
  ): { route: PublicKey[]; amountOut: BN } | null {
    if (inputMint.equals(outputMint)) {
      return null;
    }

    const openSet: PathNode[] = [];
    const visited = new Set<string>();
    const bestRoutes = new Map<string, { amount: BN; hops: number }>();

    // Initialize with starting token
    openSet.push({
      token: inputMint,
      cost: new BN(0),
      hops: 0,
      path: [],
      amountOut: amountIn,
    });
    bestRoutes.set(inputMint.toBase58(), { amount: amountIn, hops: 0 });

    let bestSolution: { route: PublicKey[]; amountOut: BN } | null = null;

    while (openSet.length > 0) {
      // Sort by cost (ascending) and get the best node
      openSet.sort((a, b) => {
        const cmp = a.cost.cmp(b.cost);
        if (cmp === 0) {
          return a.hops - b.hops;
        }
        return cmp;
      });

      const current = openSet.shift()!;
      const currentKey = current.token.toBase58();

      // Skip if we've found a better path to this token
      const best = bestRoutes.get(currentKey);
      if (best) {
        if (
          current.amountOut.lt(best.amount) ||
          (current.amountOut.eq(best.amount) && current.hops > best.hops)
        ) {
          continue;
        }
      }

      // Check if we reached the destination
      if (current.token.equals(outputMint)) {
        if (
          !bestSolution ||
          current.amountOut.gt(bestSolution.amountOut)
        ) {
          bestSolution = {
            route: [...current.path],
            amountOut: current.amountOut,
          };
        }
        continue;
      }

      // Don't expand if we've hit max hops
      if (current.hops >= this.maxHops) {
        continue;
      }

      // Mark as visited
      visited.add(currentKey);

      // Explore neighbors
      for (const pool of this.pools) {
        const nextToken = this.getOtherToken(pool, current.token);
        if (!nextToken) continue;

        const nextKey = nextToken.toBase58();
        if (visited.has(nextKey)) continue;

        const amountOut = this.getOutputAmount(pool, current.token, current.amountOut);
        if (!amountOut || amountOut.isZero()) continue;

        // Check if this is a better route
        const bestNext = bestRoutes.get(nextKey);
        const shouldExplore =
          !bestNext ||
          amountOut.gt(bestNext.amount) ||
          (amountOut.eq(bestNext.amount) && current.hops + 1 < bestNext.hops);

        if (shouldExplore) {
          bestRoutes.set(nextKey, { amount: amountOut, hops: current.hops + 1 });

          const newPath = [...current.path, pool.address];
          // Cost is negated amount_out to maximize output
          const cost = new BN(2).pow(new BN(64)).sub(amountOut);

          openSet.push({
            token: nextToken,
            cost,
            hops: current.hops + 1,
            path: newPath,
            amountOut,
          });
        }
      }
    }

    return bestSolution;
  }

  private getOtherToken(pool: PoolInfo, token: PublicKey): PublicKey | null {
    if (token.equals(pool.tokenA)) {
      return pool.tokenB;
    } else if (token.equals(pool.tokenB)) {
      return pool.tokenA;
    }
    return null;
  }

  private getOutputAmount(pool: PoolInfo, inputMint: PublicKey, amountIn: BN): BN | null {
    const isTokenA = inputMint.equals(pool.tokenA);
    const isTokenB = inputMint.equals(pool.tokenB);

    if (!isTokenA && !isTokenB) {
      return null;
    }

    const reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenA ? pool.reserveB : pool.reserveA;

    // Calculate output with fee
    const feeFactor = new BN(10000 - pool.feeBps);
    const amountInWithFee = amountIn.mul(feeFactor);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(new BN(10000)).add(amountInWithFee);

    if (denominator.isZero()) {
      return null;
    }

    return numerator.div(denominator);
  }

  static calculatePriceImpact(
    reserveIn: BN,
    reserveOut: BN,
    amountIn: BN,
    amountOut: BN
  ): number {
    // Price impact = (1 - (amountOut/reserveOut) / (amountIn/reserveIn)) * 100
    const spotPrice = reserveOut.mul(new BN(1e6)).div(reserveIn);
    const executionPrice = amountOut.mul(new BN(1e6)).div(amountIn);
    const impact = new BN(1e6).sub(executionPrice.mul(new BN(1e6)).div(spotPrice));
    return impact.toNumber() / 1e4; // Return as percentage
  }
}

