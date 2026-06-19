// SDK configuration. The caller passes a clean typed object; the SDK resolves
// network defaults so most callers only set network and tenant.

export type Network = "testnet" | "mainnet" | "local";

/** Per-network endpoints. Sensible defaults are filled in when omitted. */
export interface NetworkConfig {
  /** Orchestrator REST base URL, for example https://api.solva.dev. */
  orchestratorUrl: string;
  /** Soroban RPC URL for on-chain reads. */
  rpcUrl: string;
  /** Stellar network passphrase. */
  networkPassphrase: string;
  /** Deployed proof-registry contract address. */
  contractId: string;
}

export interface SolvaConfig {
  network: Network;
  /** Tenant (institution) identifier the SDK acts for. */
  tenant: string;
  /** Override any network default, for example to point at a local stack. */
  endpoints?: Partial<NetworkConfig>;
  /** Optional bearer token for orchestrator calls. */
  apiKey?: string;
}

const PUBLIC_NETWORK = "Public Global Stellar Network ; September 2015";
const TEST_NETWORK = "Test SDF Network ; September 2015";

// Defaults per network. Contract IDs are placeholders until deploy; they are
// meant to be overridden via `endpoints` or environment wiring.
const DEFAULTS: Record<Network, NetworkConfig> = {
  testnet: {
    orchestratorUrl: "https://api.testnet.solva.dev",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: TEST_NETWORK,
    contractId: "",
  },
  mainnet: {
    orchestratorUrl: "https://api.solva.dev",
    rpcUrl: "https://soroban.stellar.org",
    networkPassphrase: PUBLIC_NETWORK,
    contractId: "",
  },
  local: {
    orchestratorUrl: "http://localhost:8080",
    rpcUrl: "http://localhost:8000/rpc",
    networkPassphrase: TEST_NETWORK,
    contractId: "",
  },
};

/** Merge caller overrides over the network defaults into a complete config. */
export function resolveConfig(config: SolvaConfig): {
  tenant: string;
  apiKey?: string;
  endpoints: NetworkConfig;
} {
  const base = DEFAULTS[config.network];
  return {
    tenant: config.tenant,
    ...(config.apiKey !== undefined ? { apiKey: config.apiKey } : {}),
    endpoints: { ...base, ...config.endpoints },
  };
}
