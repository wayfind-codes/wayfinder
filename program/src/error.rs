use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum WayfinderError {
    #[error("Invalid Instruction")]
    InvalidInstruction,

    #[error("Incorrect Program ID")]
    IncorrectProgramId,

    #[error("Account Not Writable")]
    AccountNotWritable,

    #[error("Account Not Signer")]
    AccountNotSigner,

    #[error("Invalid Pool Account")]
    InvalidPoolAccount,

    #[error("No Valid Path Found")]
    NoValidPath,

    #[error("Insufficient Liquidity")]
    InsufficientLiquidity,

    #[error("Slippage Exceeded")]
    SlippageExceeded,

    #[error("Invalid Route")]
    InvalidRoute,

    #[error("Maximum Hops Exceeded")]
    MaximumHopsExceeded,

    #[error("Invalid Pool State")]
    InvalidPoolState,

    #[error("Calculation Overflow")]
    CalculationOverflow,
}

impl From<WayfinderError> for ProgramError {
    fn from(e: WayfinderError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> From<WayfinderError> for Result<T, ProgramError> {
    fn from(e: WayfinderError) -> Self {
        Err(ProgramError::from(e))
    }
}

