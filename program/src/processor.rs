use borsh::BorshDeserialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

use crate::{
    error::WayfinderError,
    instruction::WayfinderInstruction,
    pathfinding::AStarPathfinder,
    state::{PoolInfo, RouteState},
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = WayfinderInstruction::unpack(instruction_data)?;

        match instruction {
            WayfinderInstruction::InitializeRoute {
                input_mint,
                output_mint,
                amount_in,
                min_amount_out,
                max_hops,
            } => {
                msg!("Instruction: InitializeRoute");
                Self::process_initialize_route(
                    program_id,
                    accounts,
                    input_mint,
                    output_mint,
                    amount_in,
                    min_amount_out,
                    max_hops,
                )
            }
            WayfinderInstruction::FindOptimalRoute => {
                msg!("Instruction: FindOptimalRoute");
                Self::process_find_optimal_route(program_id, accounts)
            }
            WayfinderInstruction::ExecuteRoute => {
                msg!("Instruction: ExecuteRoute");
                Self::process_execute_route(program_id, accounts)
            }
            WayfinderInstruction::RegisterPool {
                token_a_mint,
                token_b_mint,
                fee_bps,
            } => {
                msg!("Instruction: RegisterPool");
                Self::process_register_pool(
                    program_id,
                    accounts,
                    token_a_mint,
                    token_b_mint,
                    fee_bps,
                )
            }
        }
    }

    fn process_initialize_route(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        input_mint: [u8; 32],
        output_mint: [u8; 32],
        amount_in: u64,
        min_amount_out: u64,
        max_hops: u8,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let route_state_account = next_account_info(account_info_iter)?;
        let authority_account = next_account_info(account_info_iter)?;

        if !authority_account.is_signer {
            return Err(WayfinderError::AccountNotSigner.into());
        }

        if !route_state_account.is_writable {
            return Err(WayfinderError::AccountNotWritable.into());
        }

        let route_state = RouteState {
            discriminator: 1,
            input_mint: Pubkey::new_from_array(input_mint),
            output_mint: Pubkey::new_from_array(output_mint),
            amount_in,
            min_amount_out,
            hops: 0,
            route: Vec::new(),
            status: 1, // initialized
            authority: *authority_account.key,
        };

        route_state.serialize(&mut &mut route_state_account.data.borrow_mut()[..])?;

        msg!("Route initialized: {} -> {}", 
             Pubkey::new_from_array(input_mint),
             Pubkey::new_from_array(output_mint));

        Ok(())
    }

    fn process_find_optimal_route(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let route_state_account = next_account_info(account_info_iter)?;

        if !route_state_account.is_writable {
            return Err(WayfinderError::AccountNotWritable.into());
        }

        let mut route_state =
            RouteState::try_from_slice(&route_state_account.data.borrow())?;

        // Collect pool information from remaining accounts
        let mut pools = Vec::new();
        for pool_account in account_info_iter {
            // In a real implementation, deserialize actual pool data
            // For now, using mock data structure
            if let Ok(pool_info) = PoolInfo::try_from_slice(&pool_account.data.borrow()) {
                pools.push(pool_info);
            }
        }

        // Run A* pathfinding
        let max_hops = route_state.hops.max(3); // Use provided max_hops or default to 3
        let pathfinder = AStarPathfinder::new(&pools, max_hops);
        
        let (optimal_route, _amount_out) = pathfinder.find_optimal_route(
            &route_state.input_mint,
            &route_state.output_mint,
            route_state.amount_in,
        )?;

        // Update route state
        route_state.route = optimal_route;
        route_state.hops = route_state.route.len() as u8;
        route_state.status = 2; // route_found

        route_state.serialize(&mut &mut route_state_account.data.borrow_mut()[..])?;

        msg!("Optimal route found with {} hops", route_state.hops);

        Ok(())
    }

    fn process_execute_route(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let route_state_account = next_account_info(account_info_iter)?;
        let authority_account = next_account_info(account_info_iter)?;

        if !authority_account.is_signer {
            return Err(WayfinderError::AccountNotSigner.into());
        }

        let mut route_state =
            RouteState::try_from_slice(&route_state_account.data.borrow())?;

        if route_state.status != 2 {
            return Err(WayfinderError::InvalidRoute.into());
        }

        if route_state.authority != *authority_account.key {
            return Err(WayfinderError::AccountNotSigner.into());
        }

        // In a full implementation, execute swaps through each pool in the route
        // For now, just mark as executed
        route_state.status = 3; // executed

        route_state.serialize(&mut &mut route_state_account.data.borrow_mut()[..])?;

        msg!("Route executed successfully");

        Ok(())
    }

    fn process_register_pool(
        _program_id: &Pubkey,
        _accounts: &[AccountInfo],
        _token_a_mint: [u8; 32],
        _token_b_mint: [u8; 32],
        _fee_bps: u16,
    ) -> ProgramResult {
        // Pool registration logic
        msg!("Pool registered");
        Ok(())
    }
}

