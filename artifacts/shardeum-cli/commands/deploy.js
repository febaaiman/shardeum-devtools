import chalk from "chalk";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import solc from "solc";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SHARDEUM_RPC_URL = "https://sphinx.shardeum.org/";
const SHARDEUM_CHAIN_ID = 8082;

function compileSolidityContract(sourcePath) {
  console.log(chalk.gray(`  Reading contract from: ${sourcePath}`));
  const source = readFileSync(sourcePath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "SampleContract.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  console.log(chalk.gray("  Compiling Solidity contract..."));
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e) => e.severity === "error");
    if (errors.length > 0) {
      console.log(chalk.red("\n  Compilation Errors:"));
      errors.forEach((e) => console.log(chalk.red(`  ${e.formattedMessage}`)));
      throw new Error("Contract compilation failed.");
    }

    const warnings = output.errors.filter((e) => e.severity === "warning");
    if (warnings.length > 0) {
      console.log(chalk.yellow("\n  Compilation Warnings:"));
      warnings.forEach((w) => console.log(chalk.yellow(`  ${w.formattedMessage}`)));
    }
  }

  const contractOutput = output.contracts["SampleContract.sol"]["SampleContract"];
  if (!contractOutput) {
    throw new Error('Contract "SampleContract" not found in compiled output.');
  }

  return {
    abi: contractOutput.abi,
    bytecode: contractOutput.evm.bytecode.object,
  };
}

export async function deployCommand(options = {}) {
  console.log(chalk.cyan.bold("\n  [ Deploy Command ]\n"));

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log(chalk.red("  ERROR: PRIVATE_KEY environment variable is not set."));
    console.log(chalk.yellow("  Set it in Replit Secrets as PRIVATE_KEY"));
    process.exit(1);
  }

  if (options.interactive) {
    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "Deploy SampleContract.sol to Shardeum testnet?",
        default: true,
      },
    ]);

    if (!answers.proceed) {
      console.log(chalk.yellow("\n  Deployment cancelled."));
      return;
    }
  }

  try {
    console.log(chalk.blue("  Connecting to Shardeum testnet..."));
    const provider = new ethers.JsonRpcProvider(SHARDEUM_RPC_URL, {
      chainId: SHARDEUM_CHAIN_ID,
      name: "shardeum-sphinx",
    });

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedKey, provider);
    const address = wallet.address;

    console.log(chalk.green(`  Wallet address : ${address}`));

    let balance;
    try {
      balance = await provider.getBalance(address);
      console.log(chalk.green(`  Balance        : ${ethers.formatEther(balance)} SHM`));
    } catch {
      console.log(chalk.yellow("  Could not fetch balance (network may be slow)"));
      balance = 0n;
    }

    if (balance === 0n) {
      console.log(chalk.yellow("\n  WARNING: Wallet balance is 0 SHM."));
      console.log(chalk.yellow("  Get testnet SHM from: https://faucet.shardeum.org\n"));
    }

    const contractPath = resolve(__dirname, "../contracts/SampleContract.sol");
    const { abi, bytecode } = compileSolidityContract(contractPath);

    console.log(chalk.blue("\n  Deploying contract to Shardeum testnet..."));
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    const constructorMessage = "Hello from Shardeum!";
    const contract = await factory.deploy(constructorMessage);

    console.log(chalk.yellow(`  Transaction hash: ${contract.deploymentTransaction()?.hash}`));
    console.log(chalk.gray("  Waiting for confirmation..."));

    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    console.log(chalk.green.bold("\n  Contract deployed successfully!"));
    console.log(chalk.green(`  Contract address: ${deployedAddress}`));
    console.log(chalk.gray(`\n  Check status with:`));
    console.log(chalk.cyan(`  node index.js status ${deployedAddress}\n`));
  } catch (err) {
    console.log(chalk.red(`\n  Deployment failed: ${err.message}`));
    if (err.message.includes("insufficient funds")) {
      console.log(chalk.yellow("  Get testnet SHM from: https://faucet.shardeum.org"));
    }
    process.exit(1);
  }
}
