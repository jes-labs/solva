// REST client for the orchestrator. Paths follow PRD section 13.1.
//
//   POST /v1/cycles                  trigger a proof cycle
//   GET  /v1/proofs/latest           latest published proof
//   GET  /v1/proofs/:id              proof by id
//   GET  /v1/proofs/inclusion/:ref   inclusion ref for a customer

import type { Proof, InclusionRef } from "@solva/shared-types";
import { OrchestratorError } from "./errors.js";

// The inclusion endpoint's JSON shape, matching the orchestrator's DTO.
interface InclusionRefDTO {
  proof_id: string;
  customer_id_hash: string;
  balance: string;
  root_hash: string;
  path: { hash: string; sum: string; sibling_is_left: boolean }[];
}

/** Source configuration the dashboard passes to connect a reserve source. */
export interface BankSourceConfig {
  /** "openbanking" for a signed bank balance, "onchain" for a wallet holding. */
  type: "openbanking" | "onchain";
  /** Display name shown in the dashboard. */
  label: string;
  /** Source-specific settings, for example OAuth client or wallet address. */
  settings: Record<string, unknown>;
}

export class OrchestratorClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tenant: string,
    private readonly apiKey?: string,
  ) {}

  /** Register a reserve source for the tenant. Returns the new source id. */
  async connectSource(config: BankSourceConfig): Promise<string> {
    const body = await this.request<{ id: string }>("POST", "/v1/sources", config);
    return body.id;
  }

  /** Trigger a proof cycle. Returns the published proof id. */
  async runProofCycle(): Promise<string> {
    const body = await this.request<{ id: string }>("POST", "/v1/cycles", {});
    return body.id;
  }

  /** Fetch the latest published proof for the tenant. */
  async getLatestProof(): Promise<Proof> {
    return this.request<Proof>("GET", "/v1/proofs/latest");
  }

  /** Fetch a proof by id. */
  async getProof(id: string): Promise<Proof> {
    return this.request<Proof>("GET", `/v1/proofs/${encodeURIComponent(id)}`);
  }

  /** Resolve this tenant's deployed contract and network for on-chain reads. */
  async getTenantContract(): Promise<{ contractId: string; network: string }> {
    const dto = await this.request<{ contract_id: string; network: string }>(
      "GET",
      `/v1/tenants/${encodeURIComponent(this.tenant)}/contract`,
    );
    return { contractId: dto.contract_id, network: dto.network };
  }

  /** Fetch the inclusion reference for a customer reference string. */
  async getInclusionRef(ref: string): Promise<InclusionRef> {
    const dto = await this.request<InclusionRefDTO>(
      "GET",
      `/v1/proofs/inclusion/${encodeURIComponent(ref)}`,
    );
    // The API speaks snake_case and marks a sibling with a boolean. The shared
    // type uses camelCase and a left/right position, so map across here.
    return {
      proofId: dto.proof_id,
      customerIdHash: dto.customer_id_hash,
      balance: dto.balance,
      path: dto.path.map((node) => ({
        hash: node.hash,
        sum: node.sum,
        position: node.sibling_is_left ? "left" : "right",
      })),
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-solva-tenant": this.tenant,
    };
    if (this.apiKey) {
      headers.authorization = `Bearer ${this.apiKey}`;
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      // Network-level failure, before any HTTP status.
      throw new OrchestratorError(`request to ${path} failed`, 0, { cause });
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new OrchestratorError(
        `${method} ${path} returned ${res.status}: ${detail}`,
        res.status,
      );
    }

    return (await res.json()) as T;
  }
}
