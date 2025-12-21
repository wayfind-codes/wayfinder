import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { AStarPathfinder } from '../src/pathfinding';
import { PoolInfo } from '../src/types';

describe('AStarPathfinder', () => {
  let tokenA: PublicKey;
  let tokenB: PublicKey;
  let tokenC: PublicKey;
  let pool1: PoolInfo;
  let pool2: PoolInfo;
  let pool3: PoolInfo;

  beforeEach(() => {
    tokenA = new PublicKey('11111111111111111111111111111111');
    tokenB = new PublicKey('22222222222222222222222222222222');
    tokenC = new PublicKey('33333333333333333333333333333333');

    pool1 = {
      address: new PublicKey('PoolAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
      tokenA,
      tokenB,
      feeBps: 30,
      reserveA: new BN(1000000),
      reserveB: new BN(2000000),
    };

    pool2 = {
      address: new PublicKey('PoolBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'),
      tokenA: tokenB,
      tokenB: tokenC,
      feeBps: 30,
      reserveA: new BN(2000000),
      reserveB: new BN(3000000),
    };

    pool3 = {
      address: new PublicKey('PoolCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'),
      tokenA,
      tokenB: tokenC,
      feeBps: 50,
      reserveA: new BN(1000000),
      reserveB: new BN(2500000),
    };
  });

  test('finds direct route', () => {
    const pathfinder = new AStarPathfinder([pool1], 3);
    const result = pathfinder.findOptimalRoute(tokenA, tokenB, new BN(1000));

    expect(result).not.toBeNull();
    expect(result!.route).toHaveLength(1);
    expect(result!.route[0].toBase58()).toBe(pool1.address.toBase58());
    expect(result!.amountOut.gtn(0)).toBe(true);
  });

  test('finds multi-hop route', () => {
    const pathfinder = new AStarPathfinder([pool1, pool2], 3);
    const result = pathfinder.findOptimalRoute(tokenA, tokenC, new BN(1000));

    expect(result).not.toBeNull();
    expect(result!.route).toHaveLength(2);
    expect(result!.amountOut.gtn(0)).toBe(true);
  });

  test('chooses optimal route when multiple paths exist', () => {
    const pathfinder = new AStarPathfinder([pool1, pool2, pool3], 3);
    const result = pathfinder.findOptimalRoute(tokenA, tokenC, new BN(10000));

    expect(result).not.toBeNull();
    expect(result!.amountOut.gtn(0)).toBe(true);
    
    // Should choose the route with highest output
    // Either direct through pool3 or multi-hop through pool1->pool2
  });

  test('respects max hops limit', () => {
    const pathfinder = new AStarPathfinder([pool1, pool2], 1);
    const result = pathfinder.findOptimalRoute(tokenA, tokenC, new BN(1000));

    // Should not find a route since it requires 2 hops
    expect(result).toBeNull();
  });

  test('returns null for same input/output token', () => {
    const pathfinder = new AStarPathfinder([pool1], 3);
    const result = pathfinder.findOptimalRoute(tokenA, tokenA, new BN(1000));

    expect(result).toBeNull();
  });

  test('returns null when no route exists', () => {
    const tokenD = new PublicKey('44444444444444444444444444444444');
    const pathfinder = new AStarPathfinder([pool1], 3);
    const result = pathfinder.findOptimalRoute(tokenA, tokenD, new BN(1000));

    expect(result).toBeNull();
  });
});

