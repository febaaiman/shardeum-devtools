import { Router, type IRouter } from "express";
import { ethers, Network } from "ethers";
import solc from "solc";

const router: IRouter = Router();

const SHARDEUM_RPC = "https://api.shardeum.org";
const CHAIN_ID = 8118;
const NETWORK_NAME = "Shardeum Dapps Testnet";

const staticNetwork = Network.from({ chainId: CHAIN_ID, name: "shardeum-dapps" });

function getProvider() {
  return new ethers.JsonRpcProvider(SHARDEUM_RPC, staticNetwork, {
    staticNetwork,
    polling: false,
  });
}

router.get("/shardeum/network", async (_req, res) => {
  try {
    const provider = getProvider();
    const [blockNumber, feeData, network] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
      provider.getNetwork(),
    ]);

    let peerCount = 0;
    try {
      const raw = await provider.send("net_peerCount", []);
      peerCount = parseInt(raw, 16);
    } catch {
      peerCount = 0;
    }

    const gasPriceWei = feeData.gasPrice ?? BigInt(0);
    const gasPriceGwei = Number(gasPriceWei) / 1e9;

    res.json({
      blockNumber,
      gasPrice: gasPriceGwei.toFixed(2),
      chainId: Number(network.chainId),
      networkName: NETWORK_NAME,
      rpcUrl: SHARDEUM_RPC,
      isConnected: true,
      peerCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to connect to Shardeum network", details: err.message });
  }
});

router.get("/shardeum/recent-blocks", async (_req, res) => {
  try {
    const provider = getProvider();
    const latestBlock = await provider.getBlockNumber();
    const blockCount = 5;
    const blockNums = Array.from({ length: blockCount }, (_, i) => latestBlock - i).filter((n) => n >= 0);

    const blocks = await Promise.all(
      blockNums.map(async (num) => {
        try {
          const block = await provider.getBlock(num);
          if (!block) return null;
          return {
            number: block.number,
            hash: block.hash ?? "",
            timestamp: block.timestamp,
            transactionCount: block.transactions.length,
            gasUsed: block.gasUsed.toString(),
            gasLimit: block.gasLimit.toString(),
            miner: block.miner ?? "",
          };
        } catch {
          return null;
        }
      })
    );

    res.json({
      blocks: blocks.filter(Boolean),
      latestBlock,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch recent blocks", details: err.message });
  }
});

router.post("/shardeum/compile", async (req, res) => {
  const { source, contractName } = req.body;
  if (!source || !contractName) {
    return res.status(400).json({ error: "source and contractName are required" });
  }

  try {
    const input = {
      language: "Solidity",
      sources: {
        "contract.sol": { content: source },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"],
          },
        },
        optimizer: { enabled: true, runs: 200 },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    const errors: string[] = [];
    const warnings: string[] = [];

    if (output.errors) {
      for (const err of output.errors) {
        if (err.severity === "error") {
          errors.push(err.formattedMessage);
        } else {
          warnings.push(err.formattedMessage);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "Compilation failed", details: errors.join("\n") });
    }

    const contractFile = output.contracts?.["contract.sol"];
    if (!contractFile) {
      return res.status(400).json({ error: "No contracts found in source" });
    }

    const contract = contractFile[contractName];
    if (!contract) {
      const available = Object.keys(contractFile).join(", ");
      return res.status(400).json({
        error: `Contract "${contractName}" not found. Available: ${available}`,
      });
    }

    res.json({
      abi: contract.abi,
      bytecode: "0x" + contract.evm.bytecode.object,
      contractName,
      warnings,
    });
  } catch (err: any) {
    res.status(400).json({ error: "Compilation error", details: err.message });
  }
});

router.post("/shardeum/deploy", async (req, res) => {
  const { abi, bytecode, privateKey, constructorArgs = [] } = req.body;

  if (!abi || !bytecode || !privateKey) {
    return res.status(400).json({ error: "abi, bytecode, and privateKey are required" });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    const contract = await factory.deploy(...constructorArgs);
    const deployTx = contract.deploymentTransaction();
    if (!deployTx) {
      return res.status(400).json({ error: "Deployment transaction not found" });
    }

    const receipt = await deployTx.wait();
    if (!receipt) {
      return res.status(400).json({ error: "Could not get transaction receipt" });
    }

    res.json({
      contractAddress: await contract.getAddress(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });
  } catch (err: any) {
    res.status(400).json({ error: "Deployment failed", details: err.message });
  }
});

router.get("/shardeum/transaction/:hash", async (req, res) => {
  const { hash } = req.params;
  try {
    const provider = getProvider();
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(hash),
      provider.getTransactionReceipt(hash),
    ]);

    if (!tx) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    let timestamp = 0;
    if (receipt?.blockNumber) {
      try {
        const block = await provider.getBlock(receipt.blockNumber);
        timestamp = block?.timestamp ?? 0;
      } catch {
        timestamp = 0;
      }
    }

    res.json({
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? null,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice?.toString() ?? "0",
      gasLimit: tx.gasLimit.toString(),
      gasUsed: receipt?.gasUsed.toString() ?? "0",
      blockNumber: receipt?.blockNumber ?? tx.blockNumber ?? 0,
      blockHash: receipt?.blockHash ?? tx.blockHash ?? "",
      status: receipt ? (receipt.status === 1 ? "success" : "failed") : "pending",
      timestamp,
      input: tx.data,
      nonce: tx.nonce,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch transaction", details: err.message });
  }
});

router.get("/shardeum/address/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const provider = getProvider();
    const [balanceWei, txCount, code] = await Promise.all([
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getCode(address),
    ]);

    const balanceSHM = ethers.formatEther(balanceWei);
    const isContract = code !== "0x";

    res.json({
      address,
      balanceWei: balanceWei.toString(),
      balanceSHM,
      transactionCount: txCount,
      isContract,
      code: isContract ? code : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch address info", details: err.message });
  }
});

router.post("/shardeum/contract/call", async (req, res) => {
  const { contractAddress, abi, functionName, args = [] } = req.body;

  if (!contractAddress || !abi || !functionName) {
    return res.status(400).json({ error: "contractAddress, abi, and functionName are required" });
  }

  try {
    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, abi, provider);

    if (!contract[functionName]) {
      return res.status(400).json({ error: `Function "${functionName}" not found in ABI` });
    }

    const rawResult = await contract[functionName](...args);

    let result: any;
    if (typeof rawResult === "bigint") {
      result = rawResult.toString();
    } else if (Array.isArray(rawResult)) {
      result = rawResult.map((r: any) => (typeof r === "bigint" ? r.toString() : r));
    } else {
      result = rawResult;
    }

    res.json({ result, functionName });
  } catch (err: any) {
    res.status(400).json({ error: "Contract call failed", details: err.message });
  }
});

router.post("/shardeum/contract/send", async (req, res) => {
  const { contractAddress, abi, functionName, args = [], privateKey, value = "0" } = req.body;

  if (!contractAddress || !abi || !functionName || !privateKey) {
    return res.status(400).json({ error: "contractAddress, abi, functionName, and privateKey are required" });
  }

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    if (!contract[functionName]) {
      return res.status(400).json({ error: `Function "${functionName}" not found in ABI` });
    }

    const txOptions: Record<string, any> = {};
    if (value && value !== "0") {
      txOptions.value = ethers.parseEther(value);
    }

    const tx = await contract[functionName](...args, txOptions);
    const receipt = await tx.wait();

    res.json({
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? "success" : "failed",
    });
  } catch (err: any) {
    res.status(400).json({ error: "Transaction failed", details: err.message });
  }
});

export default router;
