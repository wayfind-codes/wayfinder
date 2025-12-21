import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import BN from 'bn.js';
import { serialize } from 'borsh';

export enum WayfinderInstructionType {
  InitializeRoute = 0,
  FindOptimalRoute = 1,
  ExecuteRoute = 2,
  RegisterPool = 3,
}

export class InitializeRouteInstruction {
  tag: number = WayfinderInstructionType.InitializeRoute;
  inputMint: Uint8Array;
  outputMint: Uint8Array;
  amountIn: BN;
  minAmountOut: BN;
  maxHops: number;

  constructor(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amountIn: BN,
    minAmountOut: BN,
    maxHops: number
  ) {
    this.inputMint = inputMint.toBytes();
    this.outputMint = outputMint.toBytes();
    this.amountIn = amountIn;
    this.minAmountOut = minAmountOut;
    this.maxHops = maxHops;
  }
}

export function createInitializeRouteInstruction(
  programId: PublicKey,
  routeState: PublicKey,
  authority: PublicKey,
  inputMint: PublicKey,
  outputMint: PublicKey,
  amountIn: BN,
  minAmountOut: BN,
  maxHops: number
): TransactionInstruction {
  const instruction = new InitializeRouteInstruction(
    inputMint,
    outputMint,
    amountIn,
    minAmountOut,
    maxHops
  );

  const data = Buffer.from(serialize(instruction));

  return new TransactionInstruction({
    keys: [
      { pubkey: routeState, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}

export function createFindOptimalRouteInstruction(
  programId: PublicKey,
  routeState: PublicKey,
  poolAccounts: PublicKey[]
): TransactionInstruction {
  const data = Buffer.from([WayfinderInstructionType.FindOptimalRoute]);

  const keys = [
    { pubkey: routeState, isSigner: false, isWritable: true },
    ...poolAccounts.map((pool) => ({
      pubkey: pool,
      isSigner: false,
      isWritable: false,
    })),
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

export function createExecuteRouteInstruction(
  programId: PublicKey,
  routeState: PublicKey,
  authority: PublicKey,
  userInputTokenAccount: PublicKey,
  userOutputTokenAccount: PublicKey,
  poolAndTokenAccounts: PublicKey[]
): TransactionInstruction {
  const data = Buffer.from([WayfinderInstructionType.ExecuteRoute]);

  const keys = [
    { pubkey: routeState, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: userInputTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userOutputTokenAccount, isSigner: false, isWritable: true },
    ...poolAndTokenAccounts.map((account) => ({
      pubkey: account,
      isSigner: false,
      isWritable: true,
    })),
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

export class RegisterPoolInstruction {
  tag: number = WayfinderInstructionType.RegisterPool;
  tokenAMint: Uint8Array;
  tokenBMint: Uint8Array;
  feeBps: number;

  constructor(tokenAMint: PublicKey, tokenBMint: PublicKey, feeBps: number) {
    this.tokenAMint = tokenAMint.toBytes();
    this.tokenBMint = tokenBMint.toBytes();
    this.feeBps = feeBps;
  }
}

export function createRegisterPoolInstruction(
  programId: PublicKey,
  poolRegistry: PublicKey,
  authority: PublicKey,
  poolAccount: PublicKey,
  tokenAMint: PublicKey,
  tokenBMint: PublicKey,
  feeBps: number
): TransactionInstruction {
  const instruction = new RegisterPoolInstruction(tokenAMint, tokenBMint, feeBps);
  const data = Buffer.from(serialize(instruction));

  return new TransactionInstruction({
    keys: [
      { pubkey: poolRegistry, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: poolAccount, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}

