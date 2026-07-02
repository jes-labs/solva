import { Buffer } from "buffer";
import { Address, xdr } from "@stellar/stellar-sdk";

// Reading smart-wallet state over any Soroban RPC, no credentials needed: both
// "does the wallet exist" and "is this credential a signer" live at predictable
// ledger keys. Enumerating all signers needs an indexer and is out of scope.
export interface WalletStateReader {
  contractExists(walletAddress: string): Promise<boolean>;
  hasSecp256r1Signer(walletAddress: string, credentialId: Uint8Array): Promise<boolean>;
}

// Minimal RPC surface so this stays testable without a network.
export interface LedgerEntriesRpc {
  getLedgerEntries(
    ...keys: xdr.LedgerKey[]
  ): Promise<{ entries: Array<{ key: xdr.LedgerKey }> }>;
}

// The SignerKey::Secp256r1(credentialId) ledger key the contract stores signers under.
export function secp256r1SignerLedgerKey(
  walletAddress: string,
  credentialId: Uint8Array,
): xdr.LedgerKey {
  const signerKey = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Secp256r1"),
    xdr.ScVal.scvBytes(Buffer.from(credentialId)),
  ]);
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(walletAddress).toScAddress(),
      key: signerKey,
      durability: xdr.ContractDataDurability.persistent(),
    }),
  );
}

export function contractInstanceLedgerKey(walletAddress: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(walletAddress).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    }),
  );
}

export function rpcWalletStateReader(rpc: LedgerEntriesRpc): WalletStateReader {
  return {
    async contractExists(walletAddress) {
      const result = await rpc.getLedgerEntries(contractInstanceLedgerKey(walletAddress));
      return result.entries.length > 0;
    },
    async hasSecp256r1Signer(walletAddress, credentialId) {
      const result = await rpc.getLedgerEntries(
        secp256r1SignerLedgerKey(walletAddress, credentialId),
      );
      return result.entries.length > 0;
    },
  };
}
