use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token::Mint;
use anchor_spl::token::TokenAccount;
use syrup_cpi::Globals;
use syrup_cpi::Pool;
use syrup_cpi::Lender;
use anchor_lang::prelude::*;

declare_id!("C91qJNgXsa9CVosYJAJmxbGQAcsL7UTY7sbzpBJH7gG5");

#[program]
pub mod syrup_cpi_demo {
    use super::*;
    
    pub fn sryup_deposit_init(ctx: Context<CegaWrapperSyrupDepositInitialize>) -> Result<()> {
        let accounts = syrup_cpi::cpi::accounts::LenderInitialize {
            payer: ctx.accounts.payer.to_account_info(),
            owner: ctx.accounts.owner.to_account_info(),
            pool: ctx.accounts.pool.to_account_info(),
            shares_mint: ctx.accounts.shares_mint.to_account_info(),
            lender: ctx.accounts.lender.to_account_info(),
            locked_shares: ctx.accounts.locked_shares.to_account_info(),
            lender_shares: ctx.accounts.lender_shares.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };

        let cpi_context = CpiContext::new(ctx.accounts.syrup.to_account_info(), accounts);
        syrup_cpi::cpi::lender_initialize(cpi_context)?;
        
        Ok(())
    }

    pub fn syrup_deposit(
        ctx: Context<CegaWrapperSyrupDeposit>, 
        deposit_amount: u64) -> Result<()> {
        let accounts = syrup_cpi::cpi::accounts::LenderDeposit {
            lender: ctx.accounts.lender.to_account_info(),
            lender_user: ctx.accounts.lender_user.to_account_info(),
            pool: ctx.accounts.pool.to_account_info(),
            globals: ctx.accounts.globals.to_account_info(),
            pool_locker: ctx.accounts.pool_locker.to_account_info(),
            base_mint: ctx.accounts.base_mint.to_account_info(),
            shares_mint: ctx.accounts.shares_mint.to_account_info(),
            locked_shares: ctx.accounts.locked_shares.to_account_info(),
            lender_shares: ctx.accounts.lender_shares.to_account_info(),
            lender_locker: ctx.accounts.lender_locker.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info()
        };

        let cpi_context = CpiContext::new(ctx.accounts.syrup.to_account_info(), accounts);
        syrup_cpi::cpi::lender_deposit(cpi_context, deposit_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CegaWrapperSyrupDepositInitialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: No need to check program ownership or anything about the owner.
    pub owner: AccountInfo<'info>,

    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, address = pool.shares_mint)]
    pub shares_mint: Box<Account<'info, Mint>>,

    /// CHECK: Does not need an ownership check because it is initialised by 
    /// syrup and checked by syrup.
    #[account(mut)]
    pub lender: AccountInfo<'info>,

    /// CHECK: Does not need an ownership check because it is initialised by 
    /// syrup and checked by syrup.
    #[account(mut)]
    pub locked_shares: AccountInfo<'info>,

    /// CHECK: Does not need an ownership check because it is initialised by 
    /// syrup and checked by syrup.
    #[account(mut)]
    pub lender_shares: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub syrup: Program<'info, syrup_cpi::program::Syrup>
}

#[derive(Accounts)]
#[instruction(deposit_amount: u64)]
pub struct CegaWrapperSyrupDeposit<'info> {
    #[account(mut)]
    pub lender: Box<Account<'info, Lender>>,

    #[account(address = lender.owner)]
    pub lender_user: Signer<'info>,

    #[account(mut, address = lender.pool)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(address = pool.globals)]
    pub globals: Box<Account<'info, Globals>>,

    #[account(mut, address = pool.locker)]
    pub pool_locker: Box<Account<'info, TokenAccount>>,

    #[account(address = pool.base_mint)]
    pub base_mint: Box<Account<'info, Mint>>,

    #[account(mut, address = pool.shares_mint)]
    pub shares_mint: Box<Account<'info, Mint>>,

    #[account(mut, address = lender.locked_shares)]
    pub locked_shares: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = lender.lender_shares)]
    pub lender_shares: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = lender_locker.owner == lender_user.key(),
        constraint = lender_locker.mint == pool.base_mint)]
    pub lender_locker: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub syrup: Program<'info, syrup_cpi::program::Syrup>
}
