import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAYWB2IMDG753S3YF7DKVNLD7WBROYSP3JP5HEJET77W53UBWRD7ZX3Z",
  }
} as const

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"ProofInvalid"},
  4: {message:"InsolventBound"},
  5: {message:"ProofNotFound"}
}

export type DataKey = {tag: "Owner", values: void} | {tag: "Vk", values: void} | {tag: "LatestId", values: void} | {tag: "Proofs", values: void};


export interface PathNode {
  hash: Buffer;
  sibling_is_left: boolean;
  sum: u128;
}


export interface ProofMeta {
  l: u128;
  r: u128;
  root_h: Buffer;
  timestamp: u64;
}


export interface PubInputs {
  liabilities_total: u128;
  prev_reserves: u128;
  reserves_total: u128;
  root_hash: Buffer;
}


export interface Client {
  /**
   * Construct and simulate a get_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_proof: ({id}: {id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<ProofMeta>>>

  /**
   * Construct and simulate a publish_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  publish_proof: ({proof, pub_inputs}: {proof: Buffer, pub_inputs: PubInputs}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_latest_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_latest_proof: (options?: MethodOptions) => Promise<AssembledTransaction<Result<ProofMeta>>>

  /**
   * Construct and simulate a verify_inclusion transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  verify_inclusion: ({id, id_hash, balance, path}: {id: u64, id_hash: Buffer, balance: u128, path: Array<PathNode>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {owner, vk}: {owner: string, vk: Buffer},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({owner, vk}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAJZ2V0X3Byb29mAAAAAAAAAQAAAAAAAAACaWQAAAAAAAYAAAABAAAD6QAAB9AAAAAJUHJvb2ZNZXRhAAAAAAAAAw==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAACdmsAAAAAAA4AAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAANcHVibGlzaF9wcm9vZgAAAAAAAAIAAAAAAAAABXByb29mAAAAAAAADgAAAAAAAAAKcHViX2lucHV0cwAAAAAH0AAAAAlQdWJJbnB1dHMAAAAAAAABAAAD6QAAAAYAAAAD",
        "AAAAAAAAAAAAAAAQZ2V0X2xhdGVzdF9wcm9vZgAAAAAAAAABAAAD6QAAB9AAAAAJUHJvb2ZNZXRhAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAQdmVyaWZ5X2luY2x1c2lvbgAAAAQAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAdpZF9oYXNoAAAAA+4AAAAgAAAAAAAAAAdiYWxhbmNlAAAAAAoAAAAAAAAABHBhdGgAAAPqAAAH0AAAAAhQYXRoTm9kZQAAAAEAAAPpAAAAAQAAAAM=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAMUHJvb2ZJbnZhbGlkAAAAAwAAAAAAAAAOSW5zb2x2ZW50Qm91bmQAAAAAAAQAAAAAAAAADVByb29mTm90Rm91bmQAAAAAAAAF",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABU93bmVyAAAAAAAAAAAAAAAAAAACVmsAAAAAAAAAAAAAAAAACExhdGVzdElkAAAAAAAAAAAAAAAGUHJvb2ZzAAA=",
        "AAAAAQAAAAAAAAAAAAAACFBhdGhOb2RlAAAAAwAAAAAAAAAEaGFzaAAAA+4AAAAgAAAAAAAAAA9zaWJsaW5nX2lzX2xlZnQAAAAAAQAAAAAAAAADc3VtAAAAAAo=",
        "AAAAAQAAAAAAAAAAAAAACVByb29mTWV0YQAAAAAAAAQAAAAAAAAAAWwAAAAAAAAKAAAAAAAAAAFyAAAAAAAACgAAAAAAAAAGcm9vdF9oAAAAAAPuAAAAIAAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
        "AAAAAQAAAAAAAAAAAAAACVB1YklucHV0cwAAAAAAAAQAAAAAAAAAEWxpYWJpbGl0aWVzX3RvdGFsAAAAAAAACgAAAAAAAAANcHJldl9yZXNlcnZlcwAAAAAAAAoAAAAAAAAADnJlc2VydmVzX3RvdGFsAAAAAAAKAAAAAAAAAAlyb290X2hhc2gAAAAAAAPuAAAAIA==",
        "AAAABQAAAAAAAAAAAAAAE1Byb29mUHVibGlzaGVkRXZlbnQAAAAAAQAAABVwcm9vZl9wdWJsaXNoZWRfZXZlbnQAAAAAAAADAAAAAAAAAA5yZXNlcnZlc190b3RhbAAAAAAACgAAAAAAAAAAAAAAEWxpYWJpbGl0aWVzX3RvdGFsAAAAAAAACgAAAAEAAAAAAAAAAnRzAAAAAAAGAAAAAQAAAAI=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_proof: this.txFromJSON<Result<ProofMeta>>,
        publish_proof: this.txFromJSON<Result<u64>>,
        get_latest_proof: this.txFromJSON<Result<ProofMeta>>,
        verify_inclusion: this.txFromJSON<Result<boolean>>
  }
}