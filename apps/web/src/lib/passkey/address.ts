// The bare 'buffer' specifier is deliberate: Node resolves it to the builtin,
// bundlers resolve it to the browser-capable buffer package. 'node:buffer' would
// break the browser, and browsers have no Buffer global the XDR layer needs.
import { Buffer } from "buffer";
import { Address, StrKey, hash, xdr } from "@stellar/stellar-sdk";

// A smart wallet's address is derived deterministically from the deployer and a
// salt, so the client can know the address before the wallet is deployed. The
// salt is the hash of the passkey credential id, matching the passkey-kit
// lineage, which ties one passkey to one predictable wallet address.
export interface DeriveWalletAddressArgs {
  // The account or contract that deploys the wallet (G... or C...).
  deployer: string;
  // The passkey credential id, used as the salt source.
  keyId: Uint8Array;
  networkPassphrase: string;
}

export function deriveWalletAddress(args: DeriveWalletAddressArgs): string {
  const networkId = hash(Buffer.from(args.networkPassphrase));

  const contractIdPreimage = xdr.ContractIdPreimage.contractIdPreimageFromAddress(
    new xdr.ContractIdPreimageFromAddress({
      address: Address.fromString(args.deployer).toScAddress(),
      salt: hash(Buffer.from(args.keyId)),
    }),
  );

  const preimage = xdr.HashIdPreimage.envelopeTypeContractId(
    new xdr.HashIdPreimageContractId({ networkId, contractIdPreimage }),
  );

  return StrKey.encodeContract(hash(preimage.toXDR()));
}
