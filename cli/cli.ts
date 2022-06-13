import { Program, setProvider, Wallet, Provider as AnchorProvider, BN, workspace } from '@project-serum/anchor';
import { AugmentedProvider, SignerWallet, SolanaAugmentedProvider, SolanaProvider } from '@saberhq/solana-contrib';
import { clusterApiUrl, Connection, Keypair, PublicKey, Signer, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getATAAddress } from "@saberhq/token-utils";
import * as spl from "@solana/spl-token";
import { SyrupCpiDemo } from '../target/types/syrup_cpi_demo';

import fs from 'fs';
import os from 'os';
import { program } from "commander";
import crypto from "crypto";

// Load local solana keypair.
function loadKeypair(keypairPath: string): Keypair {
  if (!keypairPath || keypairPath == "") {
      throw new Error("Keypair is required!");
  }
  const loaded = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairPath).toString()))
  );
  return loaded;
}

async function getAndEnsureATA(
    provider: AugmentedProvider,
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    const address = await getATAAddress({ mint, owner });
    if (!(await provider.getAccountInfo(address))) {
      throw new Error("Syrup SDK: ATA account does not exist");
    }
    return address;
}

class Nonce {
  constructor(readonly value: Uint8Array) {}

  static generate(): Nonce {
    return new Nonce(crypto.randomBytes(8));
  }

  asParam(): { value: number[] } {
    return { value: [...this.value] };
  }
}

const findLenderAddress = async (
    pool: PublicKey,
    owner: PublicKey,
    programId: PublicKey
  ) => {
    return await PublicKey.findProgramAddress(
      [Buffer.from("lender"), pool.toBytes(), owner.toBytes()],
      programId
    );
};

/**
 * Finds a program address given seeds.
 * @param seeds The seeds of the program address to compute.
 * @returns The derived address.
 */
 async function findProgramAddress(
    seeds: Array<string | PublicKey | Buffer | Uint8Array | Nonce>,
    syrupAddress: PublicKey
  ): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddress(
    seeds.map((seed) => {
      if (typeof seed === "string") {
        return Buffer.from(seed);
      }
      if (seed instanceof PublicKey) {
        return seed.toBytes();
      }
      if (seed instanceof Nonce) {
        return seed.value;
      }
      return seed;
    }),
    syrupAddress
  );
}

async function devnetSyrupDepositInit(
    payer: PublicKey,
    owner: PublicKey,
    poolAddress: PublicKey,
    poolSharesMint: PublicKey,
    syrupAddress: PublicKey,
    program: Program<SyrupCpiDemo>,
) {
    const lenderShares = await getATAAddress({
        mint: poolSharesMint,
        owner,
    });
    const [lender] = await findProgramAddress([
        "lender",
        poolAddress,
        owner
    ], syrupAddress);
    const [lenderLockedShares] = await findProgramAddress([
        "locked_shares",
        lender,
    ], syrupAddress);
    await solAugmentedProvider.newTX([program.instruction.sryupDepositInit({
        accounts: {
            payer,
            owner,
            pool: poolAddress,
            sharesMint: poolSharesMint,
            lender,
            lenderShares,
            lockedShares: lenderLockedShares,
            systemProgram: SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            syrup: syrupAddress
        }
    })])
    .send()
    .then((p) => console.log(p.signature));;
}

async function devnetSyrupDeposit(
    amount: BN,
    poolAddress: PublicKey,
    poolSharesMint: PublicKey,
    poolBaseMint: PublicKey,
    poolLocker: PublicKey,
    lenderLocker: PublicKey,
    lenderUser: PublicKey,
    globals: PublicKey,
    syrupAddress: PublicKey,
    program: Program<SyrupCpiDemo>,
) {
    const lenderShares = await getATAAddress({
        mint: poolSharesMint,
        owner: lenderUser,
    });
    const [lender] = await findLenderAddress(poolAddress, lenderUser, syrupAddress);
    const [lockedShares] = await findProgramAddress([
        "locked_shares",
        lender,
    ], syrupAddress);
    await solAugmentedProvider.newTX([program.instruction.syrupDeposit(amount, {
        accounts: {
            pool: poolAddress,
            globals,
            baseMint: poolBaseMint,
            poolLocker: poolLocker,
            sharesMint: poolSharesMint,
            lender,
            lenderUser,
            lockedShares,
            lenderShares,
            lenderLocker,
            systemProgram: SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            syrup: syrupAddress
        }
    })])
    .send()
    .then((p) => console.log(p.signature));
}

let syrupCpiDemoProgram: Program<SyrupCpiDemo>;
let solAugmentedProvider: SolanaAugmentedProvider;
program.description("DEVNET syrup-cpi-demo");
program.option("-S, --syrup-address <address>", "The Syrup address on the network.")
program.option("-k, --keypair [path]", "Keypair path to be used.")
program.option("-c, --cluster <cluster>", "Solana cluster name.")
program.hook("preAction", async () => {
  // Set up a connection and an anchor provider, needed by the syrup program.
  const keypair = loadKeypair(program.opts().keypair ?? `${os.homedir()}/.config/solana/id.json`);
  const connection = new Connection(clusterApiUrl(program.opts().cluster), "confirmed");
  const anchorProvider = new AnchorProvider(
      connection,
      new Wallet(keypair),
      AnchorProvider.defaultOptions()
  );
  setProvider(anchorProvider);

  // Use the program interface.
  syrupCpiDemoProgram = workspace.SyrupCpiDemo as Program<SyrupCpiDemo>;
  const solProvider = SolanaProvider.init({
      connection: connection,
      wallet: new SignerWallet(keypair as Signer),
  });
  solAugmentedProvider = new SolanaAugmentedProvider(solProvider);
});

program
  .command("syrup-deposit-init")
  .description("Initialise a lender account.")
  .option("-o, --owner <address>", "Owner of the lender account.")
  .option("-p, --pool <address>", "The address of the pool for the doposit.")
  .option("-s, --pool-shares-mint <address>", "The pool shares mint where shares are issued from proportional with the deposit.")
  .action(async (opts) => {
    await devnetSyrupDepositInit(
        solAugmentedProvider.wallet.publicKey,
        new PublicKey(opts.owner),
        new PublicKey(opts.pool),
        new PublicKey(opts.poolSharesMint),
        new PublicKey(program.opts().syrupAddress),
        syrupCpiDemoProgram
    );
});

program
  .command("syrup-deposit")
  .description("Deposit into a pool.")
  .option("-a, --amount <USDC>", "The amount of USDC to deposit into the pool.")
  .option("-g, --globals <address>", "The globals account address of the syrup program.")
  .option("-p, --pool <address>", "The address of the pool for the doposit.")
  .option("-s, --pool-shares-mint <address>", "The pool shares mint where shares are issued from proportional with the deposit.")
  .option("-b, --pool-base-mint <address>", "The pool base mint for the pool underlying asset.")
  .option("-l, --pool-locker <address>", "The pool locker where the total liquidity gets deposited.")
  .option("-u, --lender-user <address>", "The wallet public address that will sign the deposit.")
  .action(async (opts) => {
    // Default to user's associated token account.
    const lenderLocker = await getAndEnsureATA(
        solAugmentedProvider,
        new PublicKey(opts.poolBaseMint),
        new PublicKey(opts.lenderUser)
    );
    await devnetSyrupDeposit(
        new BN(opts.amount * 1000000),
        new PublicKey(opts.pool),
        new PublicKey(opts.poolSharesMint),
        new PublicKey(opts.poolBaseMint),
        new PublicKey(opts.poolLocker),
        lenderLocker,
        new PublicKey(opts.lenderUser),
        new PublicKey(opts.globals),
        new PublicKey(program.opts().syrupAddress),
        syrupCpiDemoProgram
    );
});

program.parseAsync(process.argv).then(() => process.exit(0));