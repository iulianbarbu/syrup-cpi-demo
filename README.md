# Syrup CPI demo

This project is intended to be used as an example for [syrup-cpi](https://docs.rs/syrup-cpi/0.1.0/syrup_cpi/index.html) usage. Use it on your own risk in production.

## Components

### Syrup CPI demo

This is a program deployed on devnet which provides API for lender initialisation and lender deposit into Syrup pools. It does CPI into [`lender_deposit`](https://docs.rs/syrup-cpi/0.1.0/syrup_cpi/cpi/fn.lender_deposit.html)/[`LenderDeposit`](https://docs.rs/syrup-cpi/0.1.0/syrup_cpi/cpi/accounts/struct.LenderDeposit.html) and [`lender_initialize`](https://docs.rs/syrup-cpi/0.1.0/syrup_cpi/cpi/fn.lender_initialize.html)/[`LenderInitialize`](https://docs.rs/syrup-cpi/0.1.0/syrup_cpi/cpi/accounts/struct.LenderInitialize.html) Syrup program API.

### Syrup CPI demo CLI

To showcase the usage of the syrup-cpi-demo the CLI provides a thin wrapper over the syrup-cpi-demo
in terms of lender initialisation and depositing. Example usage below.

#### Lender initialisation

1. Create a file wallet and airdrop some USDC on devnet using the following faucet: https://faucet-flax.vercel.app/.

2. Connect the wallet to https://devnet.solana.maple.finance/#/earn/pool/C3rv1GLioSWMgvimBpSXqUWaVPtJN6SHEVmgAnrmJUVC and make sure the `Lending Balance` is `0 USDC`.

3. CLI development and manual testing prereq: `node v16.15.0` & `yarn 1.22.18`.

4. Running the CLI while being in `syrup-cpi-demo`:

Deposit init:
```bash
./node_modules/ts-node/dist/bin.js cli/cli.ts syrup-deposit -k ~/.config/solana/alice-red.json -c devnet -S 5D9yi4BKrxF8h65NkVE1raCCWFKUs5ngub2ECxhvfaZe -p C3rv1GLioSWMgvimBpSXqUWaVPtJN6SHEVmgAnrmJUVC -s 9FWsdpWsoAB1dyWkyZwiAX3tT6J6wYXca7NdRSSP1VLK -a ${USDC_AMOUNT} -g BDMBzwZEisVTTJzd9HTFsEfHMFFtXqoNjyRtz1Sp6zKP -b Doe9rajhwt18aAeaVe8vewzAsBk4kSQ2tTyZVUJhHjhY -l 35sBw68kZnuMjLXdohoRakH1RnWjnLT6i38CjTZ5YZN4 -u ${WALLET_PUBKEY}
```

Deposit:
```bash
./node_modules/ts-node/dist/bin.js cli/cli.ts syrup-deposit -k ~/.config/solana/alice-red.json -c devnet -S 5D9yi4BKrxF8h65NkVE1raCCWFKUs5ngub2ECxhvfaZe -p C3rv1GLioSWMgvimBpSXqUWaVPtJN6SHEVmgAnrmJUVC -s 9FWsdpWsoAB1dyWkyZwiAX3tT6J6wYXca7NdRSSP1VLK -a 100 -g BDMBzwZEisVTTJzd9HTFsEfHMFFtXqoNjyRtz1Sp6zKP -b Doe9rajhwt18aAeaVe8vewzAsBk4kSQ2tTyZVUJhHjhY -l 35sBw68kZnuMjLXdohoRakH1RnWjnLT6i38CjTZ5YZN4 -u ${WALLET_PUBKEY}
```
