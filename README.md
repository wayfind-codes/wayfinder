# Wayfinder

A* pathfinding-inspired swap route optimizer for Solana blockchain.

## Overview

Wayfinder is a Solana program and TypeScript SDK that implements an A* pathfinding algorithm to find optimal swap routes across multiple liquidity pools. The protocol automatically discovers the path that yields the lowest cost (highest output) for token swaps by exploring all possible routes up to a configurable maximum number of hops.

## Features

- **A* Pathfinding Algorithm**: Efficiently searches through available liquidity pools to find the optimal swap route
- **Multi-hop Routing**: Supports routes with up to 5 intermediate pools
- **On-chain Route Optimization**: Route calculation happens on-chain for transparency and verifiability
- **Slippage Protection**: Built-in minimum output amount checks
- **TypeScript SDK**: Complete client library for interacting with the program
- **Extensible Pool Registry**: Support for registering and managing multiple pool types

## Architecture

### On-chain Program (Rust)

The Solana program is written in native Rust without frameworks, providing:

- Route state management
- A* pathfinding implementation
- Pool registry
- Route execution

### TypeScript SDK

The SDK provides a complete wrapper for:

- Initializing route searches
- Finding optimal routes
- Executing swaps
- Querying route states
- Getting swap quotes off-chain

## Installation

### Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Node.js 18+
- Yarn or npm

### Building the Program

```bash
cargo build-bpf
```

The compiled program will be in `target/deploy/wayfinder.so`.

### Installing the SDK

```bash
npm install
npm run build
```

## Usage

### TypeScript SDK Example

```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { WayfinderClient } from 'wayfinder';
import BN from 'bn.js';

// Initialize client
const connection = new Connection('https://api.mainnet-beta.solana.com');
const programId = new PublicKey('YOUR_PROGRAM_ID');
const client = await WayfinderClient.create(connection, programId);

// Define swap parameters
const config = {
  inputMint: new PublicKey('INPUT_TOKEN_MINT'),
  outputMint: new PublicKey('OUTPUT_TOKEN_MINT'),
  amountIn: new BN(1000000), // 1 token with 6 decimals
  minAmountOut: new BN(950000), // Minimum acceptable output
  maxHops: 3, // Maximum number of pools to route through
};

// Initialize route
const routeState = await client.initializeRoute(authority, config);

// Find optimal route
await client.findOptimalRoute(routeState, poolAddresses);

// Execute the swap
await client.executeRoute(
  authority,
  routeState,
  userInputTokenAccount,
  userOutputTokenAccount,
  poolAndTokenAccounts
);
```

### Getting Swap Quotes

```typescript
const pools: PoolInfo[] = [
  // ... your pool information
];

const quote = await client.getSwapQuote(
  inputMint,
  outputMint,
  amountIn,
  pools,
  3 // max hops
);

if (quote) {
  console.log(`Input: ${quote.inputAmount}`);
  console.log(`Output: ${quote.outputAmount}`);
  console.log(`Route: ${quote.route.length} hops`);
  console.log(`Fee: ${quote.fee}`);
}
```

## How It Works

### A* Pathfinding

Wayfinder adapts the A* pathfinding algorithm for swap routing:

1. **Node**: Each token represents a node in the graph
2. **Edge**: Each liquidity pool represents an edge between two tokens
3. **Cost Function**: Negative of output amount (to maximize output in a min-heap)
4. **Heuristic**: Best available direct swap rate between tokens

The algorithm explores possible routes, prioritizing paths that yield higher output amounts while respecting the maximum hop limit.

### Route Discovery Process

1. Initialize with input token and amount
2. Explore all connected pools (edges)
3. Calculate output amounts through each pool
4. Track best route to each intermediate token
5. Continue until output token is reached or max hops exceeded
6. Return the route with the highest output amount

### Execution

Once an optimal route is found:

1. Verify slippage constraints
2. Execute swaps sequentially through each pool in the route
3. Validate final output meets minimum requirements

## Program Instructions

### InitializeRoute

Creates a route state account for pathfinding.

**Parameters:**
- `input_mint`: Input token mint address
- `output_mint`: Output token mint address
- `amount_in`: Amount of input tokens
- `min_amount_out`: Minimum acceptable output
- `max_hops`: Maximum route length

### FindOptimalRoute

Runs A* pathfinding to discover the best route.

**Parameters:**
- Route state account
- Pool accounts to search through

### ExecuteRoute

Executes the discovered route.

**Parameters:**
- Route state account
- User token accounts
- Pool and intermediate token accounts

### RegisterPool

Registers a liquidity pool in the protocol.

**Parameters:**
- `token_a_mint`: First token mint
- `token_b_mint`: Second token mint
- `fee_bps`: Fee in basis points

## Development

### Running Tests

```bash
# Rust tests
cd program
cargo test

# TypeScript tests
npm test
```

### Project Structure

```
wayfinder/
├── program/              # Solana program (Rust)
│   ├── src/
│   │   ├── lib.rs
│   │   ├── entrypoint.rs
│   │   ├── processor.rs
│   │   ├── instruction.rs
│   │   ├── state.rs
│   │   ├── pathfinding.rs
│   │   └── error.rs
│   └── Cargo.toml
├── src/                  # TypeScript SDK
│   ├── index.ts
│   ├── wayfinder.ts
│   ├── instructions.ts
│   ├── state.ts
│   ├── pathfinding.ts
│   └── types.ts
├── Cargo.toml
├── package.json
└── README.md
```

## Performance Considerations

- **Route Complexity**: More pools increase search time exponentially
- **Max Hops**: Limiting hops reduces computation but may miss optimal routes
- **Pool Count**: Performance degrades with 100+ pools; consider pre-filtering
- **On-chain Compute**: Route finding consumes compute units; complex routes may need multiple transactions

## Security

- Always validate pool accounts before including in routes
- Verify slippage tolerance matches your risk profile
- Check pool liquidity depth before large swaps
- Use minimum output amounts to protect against front-running

## License

MIT

## Contributing

Contributions are welcome. Please open an issue or pull request.

## Contact

For questions or support, please open an issue on GitHub.

