use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;

use crate::error::WayfinderError;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum WayfinderInstruction {
    /// Initialize a route optimizer state
    ///
    /// Accounts expected:
    /// 0. `[writable]` Route state account
    /// 1. `[signer]` Authority account
    /// 2. `[]` System program
    InitializeRoute {
        /// Input token mint
        input_mint: [u8; 32],
        /// Output token mint
        output_mint: [u8; 32],
        /// Input amount
        amount_in: u64,
        /// Minimum output amount (slippage protection)
        min_amount_out: u64,
        /// Maximum number of hops
        max_hops: u8,
    },

    /// Find optimal swap route using A* pathfinding
    ///
    /// Accounts expected:
    /// 0. `[writable]` Route state account
    /// 1. `[]` Pool accounts (multiple, dynamic)
    FindOptimalRoute,

    /// Execute the found route
    ///
    /// Accounts expected:
    /// 0. `[writable]` Route state account
    /// 1. `[signer]` User authority
    /// 2. `[writable]` User input token account
    /// 3. `[writable]` User output token account
    /// 4-N. `[]` Pool and token accounts for the route
    ExecuteRoute,

    /// Register a liquidity pool for pathfinding
    ///
    /// Accounts expected:
    /// 0. `[writable]` Pool registry account
    /// 1. `[signer]` Authority
    /// 2. `[]` Pool account
    RegisterPool {
        token_a_mint: [u8; 32],
        token_b_mint: [u8; 32],
        fee_bps: u16,
    },
}

impl WayfinderInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(input).map_err(|_| WayfinderError::InvalidInstruction.into())
    }
}

