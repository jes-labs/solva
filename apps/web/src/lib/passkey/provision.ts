import { Networks } from "@stellar/stellar-sdk";
import { deriveWalletAddress } from "./address";

// The smart-wallet provisioning boundary. The wallet's contract address is
// derived for real from the passkey credential id (deterministic, known before
// deploy). Putting the contract account on-chain needs Solva's deployed
// smart-wallet factory and its generated bindings, so that step is mocked here
// until the contract lands. The real path is marked inline and the signature
// stays stable across the swap.

// Placeholder for Solva's smart-wallet factory account. Swap for the real
// deployed factory address once the contract ships.
const DEPLOYER = "GDVEU3DD4KOFECV66VIHWEZOYX4ZKR3WV27L464SIIPOU2IUI3JCZA57";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export interface ProvisionResult {
  contractAddress: string;
  // True when this call deployed a new wallet; false when it already existed.
  deployed: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function provisionWallet(args: {
  credentialId: Uint8Array;
  // Needed by the real deploy; unused by the address derivation and the mock.
  publicKey?: Uint8Array;
}): Promise<ProvisionResult> {
  const contractAddress = deriveWalletAddress({
    deployer: DEPLOYER,
    keyId: args.credentialId,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  // Real path, once the factory + bindings are deployed:
  //   if (await contractExists(contractAddress)) return { contractAddress, deployed: false };
  //   await deployWallet(DEPLOYER, args.credentialId, args.publicKey);  // bindings + Launchtube
  await delay(900);

  return { contractAddress, deployed: true };
}
