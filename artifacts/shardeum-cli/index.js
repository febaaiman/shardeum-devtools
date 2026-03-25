#!/usr/bin/env node

import { createRequire } from "module";
import { program } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";
import { deployCommand } from "./commands/deploy.js";
import { statusCommand } from "./commands/status.js";

dotenv.config();

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

console.log(chalk.cyan.bold("\n  ⬡  Shardeum Developer CLI"));
console.log(chalk.gray("  Simplifying dApp development on Shardeum testnet\n"));

program
  .name("shardeum")
  .description(chalk.white("A CLI tool for deploying and monitoring smart contracts on Shardeum testnet"))
  .version(pkg.version, "-v, --version", "Display current version");

program
  .command("deploy")
  .description("Deploy the sample smart contract (contracts/SampleContract.sol) to Shardeum")
  .option("-i, --interactive", "Use interactive mode with prompts")
  .option("-n, --network <network>", "Network to deploy to: mainnet or testnet (default: mainnet)", "mainnet")
  .action(async (options) => {
    await deployCommand(options);
  });

program
  .command("status <contractAddress>")
  .description("Check if a smart contract exists at the given address on Shardeum testnet")
  .action(async (contractAddress) => {
    await statusCommand(contractAddress);
  });

program
  .command("help-info")
  .description("List all available commands and usage examples")
  .action(() => {
    console.log(chalk.yellow.bold("  Available Commands:\n"));

    console.log(chalk.green("  deploy"));
    console.log(chalk.gray("    Deploy contracts/SampleContract.sol to Shardeum testnet"));
    console.log(chalk.gray("    Usage: node index.js deploy"));
    console.log(chalk.gray("    Interactive: node index.js deploy --interactive\n"));

    console.log(chalk.green("  status <contractAddress>"));
    console.log(chalk.gray("    Check if a contract exists at the given address"));
    console.log(chalk.gray("    Usage: node index.js status 0xYourContractAddress\n"));

    console.log(chalk.green("  help"));
    console.log(chalk.gray("    Show built-in Commander help\n"));

    console.log(chalk.blue.bold("  Environment Variables Required:"));
    console.log(chalk.gray("    PRIVATE_KEY  - Your wallet private key (set in Replit Secrets)\n"));

    console.log(chalk.blue.bold("  Shardeum Network Info:"));
    console.log(chalk.gray("    Network: Shardeum (Mainnet)"));
    console.log(chalk.gray("    RPC URL: https://api.shardeum.org"));
    console.log(chalk.gray("    Chain ID: 8118"));
    console.log(chalk.gray("    Faucet:  https://faucet.shardeum.org\n"));
  });

program.on("command:*", () => {
  console.log(chalk.red(`  Unknown command. Run: node index.js --help`));
  process.exit(1);
});

program.parse(process.argv);

if (process.argv.length === 2) {
  program.outputHelp();
}
