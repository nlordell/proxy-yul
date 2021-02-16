import { ethers } from "ethers";

const url = process.env.JSON_RPC_URL || "http://localhost:8545";

export const provider = new ethers.providers.JsonRpcProvider(url);
export const signer = provider.getSigner();
