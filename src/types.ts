import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface PoolInfo {
  address: PublicKey;
  tokenA: PublicKey;
  tokenB: PublicKey;
  feeBps: number;
  reserveA: BN;
  reserveB: BN;
}

export interface RouteConfig {
  inputMint: PublicKey;
  outputMint: PublicKey;
  amountIn: BN;
  minAmountOut: BN;
  maxHops: number;
}

export interface RouteResult {
  route: PublicKey[];
  amountOut: BN;
  hops: number;
  priceImpact: number;
}

export interface SwapQuote {
  inputAmount: BN;
  outputAmount: BN;
  priceImpact: number;
  fee: BN;
  route: PublicKey[];
}

export enum RouteStatus {
  Uninitialized = 0,
  Initialized = 1,
  RouteFound = 2,
  Executed = 3,
}

