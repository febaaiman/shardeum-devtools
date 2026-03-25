import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// --- API Client Setup ---
const getBaseUrl = () => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/shardeum`;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    let errorMsg = "API Error";
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      errorMsg = await res.text() || res.statusText;
    }
    throw new Error(errorMsg);
  }
  
  return res.json();
}

// --- Types ---
export interface NetworkStatus {
  blockNumber: number;
  gasPrice: string;
  chainId: number;
  networkName: string;
  rpcUrl: string;
  isConnected: boolean;
  peerCount: number;
}

export interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactionCount: number;
  gasUsed: string;
  gasLimit: string;
  miner?: string;
}

export interface RecentBlocksResult {
  blocks: BlockInfo[];
  latestBlock: number;
}

export interface CompileRequest {
  source: string;
  contractName: string;
}

export interface CompileResult {
  abi: any[];
  bytecode: string;
  contractName: string;
  warnings?: string[];
}

export interface DeployRequest {
  abi: any[];
  bytecode: string;
  privateKey: string;
  constructorArgs: any[];
}

export interface DeployResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

export interface TransactionDetails {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed: string;
  blockNumber: number;
  blockHash: string;
  status: string;
  timestamp: number;
  input: string;
  nonce: number;
}

export interface AddressInfo {
  address: string;
  balanceWei: string;
  balanceSHM: string;
  transactionCount: number;
  isContract: boolean;
  code?: string;
}

export interface ContractCallRequest {
  contractAddress: string;
  abi: any[];
  functionName: string;
  args: any[];
}

export interface ContractCallResult {
  result: any;
  functionName: string;
}

export interface ContractSendRequest extends ContractCallRequest {
  privateKey: string;
  value?: string;
}

export interface ContractSendResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: string;
}

// --- Hooks ---

export function useNetworkStatus() {
  return useQuery<NetworkStatus>({
    queryKey: ["/api/shardeum/network"],
    queryFn: () => fetchApi<NetworkStatus>("/network"),
    refetchInterval: 10000, // Poll every 10s
  });
}

export function useRecentBlocks() {
  return useQuery<RecentBlocksResult>({
    queryKey: ["/api/shardeum/recent-blocks"],
    queryFn: () => fetchApi<RecentBlocksResult>("/recent-blocks"),
    refetchInterval: 10000,
  });
}

export function useCompileContract() {
  return useMutation<CompileResult, Error, CompileRequest>({
    mutationFn: (data) => fetchApi<CompileResult>("/compile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });
}

export function useDeployContract() {
  return useMutation<DeployResult, Error, DeployRequest>({
    mutationFn: (data) => fetchApi<DeployResult>("/deploy", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });
}

export function useTransaction(hash: string | undefined) {
  return useQuery<TransactionDetails>({
    queryKey: ["/api/shardeum/transaction", hash],
    queryFn: () => fetchApi<TransactionDetails>(`/transaction/${hash}`),
    enabled: !!hash && hash.length === 66,
    retry: 1,
  });
}

export function useAddressInfo(address: string | undefined) {
  return useQuery<AddressInfo>({
    queryKey: ["/api/shardeum/address", address],
    queryFn: () => fetchApi<AddressInfo>(`/address/${address}`),
    enabled: !!address && address.length === 42,
    retry: 1,
  });
}

export function useCallContract() {
  return useMutation<ContractCallResult, Error, ContractCallRequest>({
    mutationFn: (data) => fetchApi<ContractCallResult>("/contract/call", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });
}

export function useSendContract() {
  return useMutation<ContractSendResult, Error, ContractSendRequest>({
    mutationFn: (data) => fetchApi<ContractSendResult>("/contract/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });
}
