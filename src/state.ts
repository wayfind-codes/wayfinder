import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { deserialize, serialize, field, vec } from 'borsh';

export const MAX_ROUTE_HOPS = 5;

export class RouteState {
  @field({ type: 'u8' })
  discriminator: number = 0;

  @field({ type: 'publicKey' })
  inputMint: PublicKey = PublicKey.default;

  @field({ type: 'publicKey' })
  outputMint: PublicKey = PublicKey.default;

  @field({ type: 'u64' })
  amountIn: BN = new BN(0);

  @field({ type: 'u64' })
  minAmountOut: BN = new BN(0);

  @field({ type: 'u8' })
  hops: number = 0;

  @field({ type: vec('publicKey') })
  route: PublicKey[] = [];

  @field({ type: 'u8' })
  status: number = 0;

  @field({ type: 'publicKey' })
  authority: PublicKey = PublicKey.default;

  constructor(fields?: {
    discriminator?: number;
    inputMint?: PublicKey;
    outputMint?: PublicKey;
    amountIn?: BN;
    minAmountOut?: BN;
    hops?: number;
    route?: PublicKey[];
    status?: number;
    authority?: PublicKey;
  }) {
    if (fields) {
      Object.assign(this, fields);
    }
  }

  static fromBuffer(buffer: Buffer): RouteState {
    return deserialize(RouteState, buffer);
  }

  toBuffer(): Buffer {
    return Buffer.from(serialize(this));
  }
}

export class PoolInfoState {
  @field({ type: 'publicKey' })
  address: PublicKey = PublicKey.default;

  @field({ type: 'publicKey' })
  tokenA: PublicKey = PublicKey.default;

  @field({ type: 'publicKey' })
  tokenB: PublicKey = PublicKey.default;

  @field({ type: 'u16' })
  feeBps: number = 0;

  @field({ type: 'u64' })
  reserveA: BN = new BN(0);

  @field({ type: 'u64' })
  reserveB: BN = new BN(0);

  constructor(fields?: {
    address?: PublicKey;
    tokenA?: PublicKey;
    tokenB?: PublicKey;
    feeBps?: number;
    reserveA?: BN;
    reserveB?: BN;
  }) {
    if (fields) {
      Object.assign(this, fields);
    }
  }

  getOutputAmount(inputMint: PublicKey, amountIn: BN): BN | null {
    const isTokenA = inputMint.equals(this.tokenA);
    const isTokenB = inputMint.equals(this.tokenB);

    if (!isTokenA && !isTokenB) {
      return null;
    }

    const reserveIn = isTokenA ? this.reserveA : this.reserveB;
    const reserveOut = isTokenA ? this.reserveB : this.reserveA;

    // Calculate output: (amountIn * (10000 - feeBps) * reserveOut) / (reserveIn * 10000 + amountIn * (10000 - feeBps))
    const feeFactor = new BN(10000 - this.feeBps);
    const amountInWithFee = amountIn.mul(feeFactor);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(new BN(10000)).add(amountInWithFee);

    return numerator.div(denominator);
  }

  getOtherToken(token: PublicKey): PublicKey | null {
    if (token.equals(this.tokenA)) {
      return this.tokenB;
    } else if (token.equals(this.tokenB)) {
      return this.tokenA;
    }
    return null;
  }

  static fromBuffer(buffer: Buffer): PoolInfoState {
    return deserialize(PoolInfoState, buffer);
  }
}

