# Solva demo on a single VM

Runs the whole backend (Postgres, Redis, prover, orchestrator, sandbox) on one
Ubuntu box with Docker. The website (Vercel) points at it. Meant for a temporary
demo, not production.

## Prerequisites

- An Ubuntu 24.04 VM (AWS Lightsail 4 GB or similar), TCP ports 8080 and 8090 open.
- Two proof-registry contracts deployed on Testnet, owned by your signer, plus
  the signer's secret seed. Deploy them from a machine with the Stellar CLI:
  ```bash
  cargo build -p proof-registry --release --target wasm32v1-none
  A=$(stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm \
    --source signor --network testnet -- --owner signor \
    --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin 2>/dev/null)
  B=$(stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm \
    --source signor --network testnet -- --owner signor \
    --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin 2>/dev/null)
  echo "$A"; echo "$B"; stellar keys show signor
  ```

## Deploy on the VM

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/jes-labs/solva
cd solva
export SIGNER_SECRET=S...     # from `stellar keys show signor`
export CONTRACT_A=C...        # Meridian registry
export CONTRACT_B=C...        # Solstice registry
bash deploy/vm/setup.sh
```

The script installs Docker, generates the bank signing key and API tokens, brings
up the stack, applies migrations, and seeds the two demo institutions. The first
prover build takes several minutes. It prints the exact Vercel variables at the end.

## Point the website at the box (Vercel)

Set these environment variables on the `apps/website` project, using the values
the script printed:

```
ORCHESTRATOR_URL              = http://<STATIC_IP>:8080
SANDBOX_URL                   = http://<STATIC_IP>:8090
ORCH_API_TOKEN                = <printed by the script>
NEXT_PUBLIC_STELLAR_EXPLORER  = https://stellar.expert/explorer/testnet
```

Redeploy the website, then open `https://<your-site>/sandbox`.

## Operate

```bash
sudo docker compose -f deploy/vm/compose.yml ps        # status
sudo docker compose -f deploy/vm/compose.yml logs -f    # logs
sudo docker compose -f deploy/vm/compose.yml down       # stop
```

Stop the VM from the Lightsail console when you are not demoing to save credits.
The static IP keeps the address stable across stop/start.
