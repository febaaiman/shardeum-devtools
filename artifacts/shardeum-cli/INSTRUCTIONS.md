# Shardeum Developer CLI - Setup & Usage Instructions

## Project Structure

```
shardeum-cli/
├── index.js              ← Main CLI entry point
├── package.json          ← Dependencies
├── .env.example          ← Example environment file
├── commands/
│   ├── deploy.js         ← Deploy command logic
│   └── status.js         ← Status command logic
└── contracts/
    └── SampleContract.sol ← Sample Solidity contract
```

## Step 1: Set Your Private Key

### Option A — In Replit (for running in the Replit Shell):
1. Look for the **lock icon** in the left sidebar
2. Click it to open Secrets
3. Add a new secret:
   - Key: `PRIVATE_KEY`
   - Value: your wallet private key

### Option B — Locally on your machine:
```bash
cp .env.example .env
# Edit .env and set PRIVATE_KEY=your_key_here
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Run the CLI

### Show all commands:
```bash
node index.js --help
node index.js help-info
```

### Deploy the smart contract:
```bash
node index.js deploy
```

### Deploy with interactive prompts:
```bash
node index.js deploy --interactive
```

### Check contract status:
```bash
node index.js status 0xYourContractAddressHere
```

## Shardeum Testnet Info

| Setting   | Value                         |
|-----------|-------------------------------|
| Network   | Shardeum Sphinx Testnet       |
| RPC URL   | https://sphinx.shardeum.org/  |
| Chain ID  | 8082                          |
| Symbol    | SHM                           |
| Faucet    | https://faucet.shardeum.org   |

## Get Testnet SHM Tokens

Before deploying, you need testnet SHM (it's free):
1. Go to https://faucet.shardeum.org
2. Paste your wallet address
3. Click "Request SHM"
4. Wait 1-2 minutes for tokens to arrive

## Notes

- The CLI connects to Shardeum Sphinx testnet (no real money involved)
- Keep your PRIVATE_KEY secret — never commit it to git or share it
- The sample contract (SampleContract.sol) stores a message on-chain
- After deploying, save the contract address to check status later
