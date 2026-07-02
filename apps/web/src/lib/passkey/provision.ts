import { getSession } from "./session";
import { deployWallet } from "./wallet";

// The smart-wallet provisioning boundary. The passkey's P-256 key becomes the
// wallet's first signer, and the wallet is deployed at its derived address on
// testnet. The deployer is an ephemeral, friendbot-funded session key held in
// the browser (see session.ts), so this needs no server and no stored secret.
export interface ProvisionResult {
  contractAddress: string;
  // True when this call deployed a new wallet; false when it already existed.
  deployed: boolean;
}

export async function provisionWallet(args: {
  credentialId: Uint8Array;
  publicKey: Uint8Array;
}): Promise<ProvisionResult> {
  const session = await getSession();
  const { walletAddress, deployed } = await deployWallet(
    session,
    args.credentialId,
    args.publicKey,
  );
  return { contractAddress: walletAddress, deployed };
}
