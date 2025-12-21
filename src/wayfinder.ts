import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  createInitializeRouteInstruction,
  createFindOptimalRouteInstruction,
  createExecuteRouteInstruction,
} from './instructions';
import { RouteState } from './state';
import { AStarPathfinder } from './pathfinding';
import { PoolInfo, RouteConfig, RouteResult, SwapQuote } from './types';

export class WayfinderClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
    this.programId = programId;
  }

  async initializeRoute(
    authority: Keypair,
    config: RouteConfig
  ): Promise<PublicKey> {
    const routeState = Keypair.generate();

    const instruction = createInitializeRouteInstruction(
      this.programId,
      routeState.publicKey,
      authority.publicKey,
      config.inputMint,
      config.outputMint,
      config.amountIn,
      config.minAmountOut,
      config.maxHops
    );

    const transaction = new Transaction().add(instruction);

    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [authority, routeState],
      {
        commitment: 'confirmed',
      }
    );

    return routeState.publicKey;
  }

  async findOptimalRoute(
    routeStateAddress: PublicKey,
    pools: PublicKey[]
  ): Promise<void> {
    const instruction = createFindOptimalRouteInstruction(
      this.programId,
      routeStateAddress,
      pools
    );

    const transaction = new Transaction().add(instruction);

    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [],
      {
        commitment: 'confirmed',
      }
    );
  }

  async executeRoute(
    authority: Keypair,
    routeStateAddress: PublicKey,
    userInputTokenAccount: PublicKey,
    userOutputTokenAccount: PublicKey,
    poolAndTokenAccounts: PublicKey[]
  ): Promise<void> {
    const instruction = createExecuteRouteInstruction(
      this.programId,
      routeStateAddress,
      authority.publicKey,
      userInputTokenAccount,
      userOutputTokenAccount,
      poolAndTokenAccounts
    );

    const transaction = new Transaction().add(instruction);

    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [authority],
      {
        commitment: 'confirmed',
      }
    );
  }

  async getRouteState(routeStateAddress: PublicKey): Promise<RouteState> {
    const accountInfo = await this.connection.getAccountInfo(routeStateAddress);
    
    if (!accountInfo) {
      throw new Error('Route state account not found');
    }

    return RouteState.fromBuffer(accountInfo.data);
  }

  async getSwapQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amountIn: BN,
    pools: PoolInfo[],
    maxHops: number = 3
  ): Promise<SwapQuote | null> {
    const pathfinder = new AStarPathfinder(pools, maxHops);
    const result = pathfinder.findOptimalRoute(inputMint, outputMint, amountIn);

    if (!result) {
      return null;
    }

    // Calculate total fees
    let totalFee = new BN(0);
    for (const poolAddress of result.route) {
      const pool = pools.find((p) => p.address.equals(poolAddress));
      if (pool) {
        const fee = amountIn.mul(new BN(pool.feeBps)).div(new BN(10000));
        totalFee = totalFee.add(fee);
      }
    }

    // Calculate price impact (simplified)
    const priceImpact = 0; // Implement based on pool reserves

    return {
      inputAmount: amountIn,
      outputAmount: result.amountOut,
      priceImpact,
      fee: totalFee,
      route: result.route,
    };
  }

  static async create(
    connection: Connection,
    programId: PublicKey
  ): Promise<WayfinderClient> {
    return new WayfinderClient(connection, programId);
  }
}

