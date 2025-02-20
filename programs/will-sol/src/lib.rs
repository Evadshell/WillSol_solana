use anchor_lang::prelude::*;

declare_id!("7rqSkHiGHGJEbTNsQsDKEfkdxdqcx9EyTPdKW3Vju7um");

#[program]
pub mod will_sol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
