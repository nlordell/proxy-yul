import { ethers, BigNumber } from "ethers";

import { provider } from "./provider";

export type Slot = "implementation" | "beacon" | "admin";

export function slot(name: Slot): string {
  return BigNumber.from(ethers.utils.id(`eip1967.proxy.${name}`))
    .sub(1)
    .toHexString();
}

export async function getProxyStorage(
  proxy: string,
  name: Slot
): Promise<string> {
  return ethers.utils.getAddress(
    ethers.utils.hexZeroPad(await provider.getStorageAt(proxy, slot(name)), 20)
  );
}
