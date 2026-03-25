import chalk from "chalk";
import { ethers } from "ethers";

const SHARDEUM_RPC_URL = "https://sphinx.shardeum.org/";
const SHARDEUM_CHAIN_ID = 8082;

export async function statusCommand(contractAddress) {
  console.log(chalk.cyan.bold("\n  [ Status Command ]\n"));

  if (!contractAddress) {
    console.log(chalk.red("  ERROR: No contract address provided."));
    console.log(chalk.yellow("  Usage: node index.js status <contractAddress>"));
    process.exit(1);
  }

  if (!ethers.isAddress(contractAddress)) {
    console.log(chalk.red(`  ERROR: "${contractAddress}" is not a valid Ethereum address.`));
    console.log(chalk.yellow("  Addresses must start with 0x and be 42 characters long."));
    process.exit(1);
  }

  try {
    console.log(chalk.blue("  Connecting to Shardeum testnet..."));
    const provider = new ethers.JsonRpcProvider(SHARDEUM_RPC_URL, {
      chainId: SHARDEUM_CHAIN_ID,
      name: "shardeum-sphinx",
    });

    console.log(chalk.gray(`  Checking address: ${contractAddress}`));

    let code;
    let balance;
    let txCount;

    try {
      [code, balance, txCount] = await Promise.all([
        provider.getCode(contractAddress),
        provider.getBalance(contractAddress),
        provider.getTransactionCount(contractAddress),
      ]);
    } catch (networkErr) {
      console.log(chalk.red(`\n  Network error: ${networkErr.message}`));
      console.log(chalk.yellow("\n  Troubleshooting tips:"));
      console.log(chalk.gray("  1. Make sure you are connected to the internet"));
      console.log(chalk.gray("  2. Shardeum testnet RPC: https://sphinx.shardeum.org/"));
      console.log(chalk.gray("  3. Run this CLI locally on your machine for best results"));
      console.log(chalk.gray("  4. Check Shardeum status: https://status.shardeum.org"));
      process.exit(1);
    }

    const isContract = code !== "0x" && code.length > 2;

    console.log(chalk.blue("\n  ─────────────────────────────────────────"));
    console.log(chalk.white.bold("  Contract Status Report"));
    console.log(chalk.blue("  ─────────────────────────────────────────"));
    console.log(chalk.gray(`  Network    : Shardeum Sphinx Testnet`));
    console.log(chalk.gray(`  Address    : ${contractAddress}`));
    console.log(chalk.gray(`  Balance    : ${ethers.formatEther(balance)} SHM`));
    console.log(chalk.gray(`  Tx Count   : ${txCount}`));

    if (isContract) {
      console.log(chalk.green.bold(`  Type       : Smart Contract ✓`));
      console.log(chalk.green(`  Status     : Contract exists and is deployed`));
      console.log(chalk.gray(`  Bytecode   : ${code.length / 2 - 1} bytes`));
    } else {
      console.log(chalk.yellow(`  Type       : Externally Owned Account (EOA)`));
      console.log(chalk.yellow(`  Status     : No contract deployed at this address`));
    }

    console.log(chalk.blue("  ─────────────────────────────────────────\n"));

    if (!isContract) {
      console.log(chalk.gray("  To deploy a contract, run:"));
      console.log(chalk.cyan("  node index.js deploy\n"));
    }
  } catch (err) {
    console.log(chalk.red(`\n  Status check failed: ${err.message}`));
    process.exit(1);
  }
}
