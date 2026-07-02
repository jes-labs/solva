// Proving via the Barretenberg CLI. The prover builds the Poseidon2 Merkle Sum
// Tree (tree.rs), writes the circuit witness as Prover.toml, then shells out to
// nargo and bb to produce the UltraHonk proof the contract verifies. This is the
// rs-soroban-ultrahonk reference flow, pinned to Noir beta.9 and bb 0.87.0.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;

use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::tree::{FieldElem, MerkleSumTree, Node};

// Fixed circuit dimensions, from circuits/solvency/src/main.nr.
pub const N: usize = 8; // customer leaves
pub const M: usize = 4; // reserve figures
const DEPTH: usize = 3; // tree depth, log2(N)

// nargo and bb read and write Prover.toml and target/ in the circuit package, so
// proofs run one at a time per process. Scale out with more prover instances.
static BB_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug)]
pub enum ProvingError {
    WitnessAssembly(String),
    ProofGeneration(String),
}

impl std::fmt::Display for ProvingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProvingError::WitnessAssembly(m) => write!(f, "witness assembly failed: {m}"),
            ProvingError::ProofGeneration(m) => write!(f, "proof generation failed: {m}"),
        }
    }
}

impl std::error::Error for ProvingError {}

// One cycle's private witness: a customer id hash and balance per leaf, the
// reserve figures, and the previous cycle's reserve total for the fraud bound.
// Zeroized on drop so customer balances do not linger in memory.
#[derive(Default, Zeroize, ZeroizeOnDrop)]
pub struct Witness {
    pub leaf_ids: Vec<FieldElem>,
    pub leaf_balances: Vec<u128>,
    pub reserves: Vec<u128>,
    pub prev_reserves: u128,
}

#[derive(Debug)]
pub struct ProofBundle {
    pub proof: Vec<u8>,
    pub root_hash: FieldElem,
    pub reserves_total: u128,
    pub liabilities_total: u128,
    pub prev_reserves: u128,
    pub serialized_tree: Vec<u8>,
}

pub struct Prover {
    circuit_dir: PathBuf,
}

impl Prover {
    pub fn new(circuit_dir: impl Into<PathBuf>) -> Self {
        Self {
            circuit_dir: circuit_dir.into(),
        }
    }

    pub fn prove(&self, w: &Witness) -> Result<ProofBundle, ProvingError> {
        if w.leaf_ids.len() != w.leaf_balances.len() {
            return Err(ProvingError::WitnessAssembly(
                "leaf_ids and leaf_balances length mismatch".into(),
            ));
        }
        if w.leaf_balances.is_empty() {
            return Err(ProvingError::WitnessAssembly(
                "at least one customer is required".into(),
            ));
        }
        if w.leaf_balances.len() > N {
            return Err(ProvingError::WitnessAssembly(format!(
                "at most {N} customers supported"
            )));
        }
        if w.reserves.len() > M {
            return Err(ProvingError::WitnessAssembly(format!(
                "at most {M} reserve figures supported"
            )));
        }

        let liabilities_total: u128 = w.leaf_balances.iter().sum();
        let reserves_total: u128 = w.reserves.iter().sum();
        if reserves_total < liabilities_total {
            return Err(ProvingError::WitnessAssembly(format!(
                "insolvent: reserves {reserves_total} < liabilities {liabilities_total}"
            )));
        }

        // Build the tree padded to N leaves to get the committed root. Padding
        // leaves are (id 0, balance 0), which add nothing to the sum.
        let mut leaves: Vec<Node> = w
            .leaf_ids
            .iter()
            .zip(&w.leaf_balances)
            .map(|(id, &bal)| Node::leaf(*id, bal))
            .collect();
        while leaves.len() < N {
            leaves.push(Node::leaf([0u8; 32], 0));
        }
        let tree = MerkleSumTree::build(leaves);
        let root_hash = tree.root().hash;
        // Each real customer's inclusion path, so a customer can later call the
        // contract's verify_inclusion without anyone rebuilding the tree.
        let serialized_tree = serialize_tree(&tree, w, &root_hash);

        // The bb flow shares Prover.toml and target/ in the circuit dir.
        let _guard = BB_LOCK.lock().unwrap_or_else(|p| p.into_inner());

        self.write_prover_toml(w, reserves_total, liabilities_total, &root_hash)?;
        run(&self.circuit_dir, "nargo", &["execute"])?;
        run(
            &self.circuit_dir,
            "bb",
            &[
                "prove",
                "--scheme",
                "ultra_honk",
                "--oracle_hash",
                "keccak",
                "--bytecode_path",
                "target/solva_solvency.json",
                "--witness_path",
                "target/solva_solvency.gz",
                "--output_path",
                "target",
                "--output_format",
                "bytes_and_fields",
            ],
        )?;

        let proof = std::fs::read(self.circuit_dir.join("target/proof"))
            .map_err(|e| ProvingError::ProofGeneration(format!("read proof: {e}")))?;

        Ok(ProofBundle {
            proof,
            root_hash,
            reserves_total,
            liabilities_total,
            prev_reserves: w.prev_reserves,
            serialized_tree,
        })
    }

    fn write_prover_toml(
        &self,
        w: &Witness,
        r: u128,
        l: u128,
        root_hash: &FieldElem,
    ) -> Result<(), ProvingError> {
        let mut ids: Vec<String> = w
            .leaf_ids
            .iter()
            .map(|id| format!("\"0x{}\"", hex::encode(id)))
            .collect();
        let mut bals: Vec<String> = w.leaf_balances.iter().map(|b| format!("\"{b}\"")).collect();
        while ids.len() < N {
            ids.push("\"0x0\"".into());
            bals.push("\"0\"".into());
        }
        let mut reserves: Vec<String> = w.reserves.iter().map(|x| format!("\"{x}\"")).collect();
        while reserves.len() < M {
            reserves.push("\"0\"".into());
        }
        let zero_row = format!("[{}]", ["\"0\""; DEPTH].join(", "));
        let paths = vec![zero_row; N].join(", ");

        let toml = format!(
            "R = \"{r}\"\n\
             root_h = \"0x{root}\"\n\
             L = \"{l}\"\n\
             R_prev = \"{prev}\"\n\
             leaf_ids = [{ids}]\n\
             leaf_balances = [{bals}]\n\
             reserves = [{reserves}]\n\
             merkle_paths = [{paths}]\n",
            root = hex::encode(root_hash),
            prev = w.prev_reserves,
            ids = ids.join(", "),
            bals = bals.join(", "),
            reserves = reserves.join(", "),
        );
        std::fs::write(self.circuit_dir.join("Prover.toml"), toml)
            .map_err(|e| ProvingError::ProofGeneration(format!("write Prover.toml: {e}")))
    }
}

// parse_field reads a hex (0x optional) id hash into a 32-byte field element,
// right-aligned big-endian.
pub fn parse_field(hex_str: &str) -> Result<FieldElem, ProvingError> {
    let s = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    let bytes = hex::decode(s)
        .map_err(|e| ProvingError::WitnessAssembly(format!("bad id_hash hex: {e}")))?;
    if bytes.len() > 32 {
        return Err(ProvingError::WitnessAssembly(
            "id_hash longer than 32 bytes".into(),
        ));
    }
    let mut out = [0u8; 32];
    out[32 - bytes.len()..].copy_from_slice(&bytes);
    Ok(out)
}

// serialize_leaves records the customer leaves in order for the audit log and,
// later, inclusion-path reconstruction. The full path encoding lands with the
// inclusion endpoint.
// One sibling step on a customer's inclusion path. sibling_is_left matches the
// contract's PathNode: when true, the sibling is the left child and this node is
// the right. sum is the sibling subtree's total, bound into the parent hash.
#[derive(serde::Serialize)]
struct SerializedPathNode {
    hash: String,
    sum: String,
    sibling_is_left: bool,
}

// One customer leaf plus the path that proves it is in the committed root.
#[derive(serde::Serialize)]
struct SerializedLeaf {
    id_hash: String,
    balance: String,
    path: Vec<SerializedPathNode>,
}

#[derive(serde::Serialize)]
struct SerializedTree {
    root_hash: String,
    leaves: Vec<SerializedLeaf>,
}

// serialize_tree records each real customer's leaf and inclusion path. The
// orchestrator persists this; the web/SDK read a customer's path and hand it to
// the contract's verify_inclusion. Hashing stays only in Rust (build) and the
// contract (verify), so there is no second hash implementation to keep in sync.
fn serialize_tree(tree: &MerkleSumTree, w: &Witness, root_hash: &FieldElem) -> Vec<u8> {
    let leaves: Vec<SerializedLeaf> = (0..w.leaf_balances.len())
        .map(|i| {
            let path = tree
                .inclusion_path(i)
                .into_iter()
                .map(|step| SerializedPathNode {
                    hash: format!("0x{}", hex::encode(step.sibling.hash)),
                    sum: step.sibling.sum.to_string(),
                    sibling_is_left: step.sibling_is_left,
                })
                .collect();
            SerializedLeaf {
                id_hash: format!("0x{}", hex::encode(w.leaf_ids[i])),
                balance: w.leaf_balances[i].to_string(),
                path,
            }
        })
        .collect();

    serde_json::to_vec(&SerializedTree {
        root_hash: format!("0x{}", hex::encode(root_hash)),
        leaves,
    })
    .unwrap_or_default()
}

fn run(dir: &Path, cmd: &str, args: &[&str]) -> Result<(), ProvingError> {
    let output = Command::new(cmd)
        .args(args)
        .current_dir(dir)
        .output()
        .map_err(|e| ProvingError::ProofGeneration(format!("spawn {cmd}: {e}")))?;
    if !output.status.success() {
        return Err(ProvingError::ProofGeneration(format!(
            "{cmd} {} failed: {}",
            args.first().copied().unwrap_or(""),
            String::from_utf8_lossy(&output.stderr).trim()
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn id(n: u8) -> FieldElem {
        let mut b = [0u8; 32];
        b[31] = n;
        b
    }

    #[test]
    fn insolvent_rejected() {
        let w = Witness {
            leaf_ids: vec![id(1)],
            leaf_balances: vec![200],
            reserves: vec![100],
            prev_reserves: 0,
        };
        let err = Prover::new("circuits/solvency").prove(&w).unwrap_err();
        assert!(matches!(err, ProvingError::WitnessAssembly(_)));
    }

    #[test]
    fn length_mismatch_rejected() {
        let w = Witness {
            leaf_ids: vec![id(1)],
            leaf_balances: vec![1, 2],
            reserves: vec![3],
            prev_reserves: 0,
        };
        let err = Prover::new("circuits/solvency").prove(&w).unwrap_err();
        assert!(matches!(err, ProvingError::WitnessAssembly(_)));
    }

    #[test]
    fn empty_rejected() {
        let w = Witness::default();
        let err = Prover::new("circuits/solvency").prove(&w).unwrap_err();
        assert!(matches!(err, ProvingError::WitnessAssembly(_)));
    }

    #[test]
    fn zeroize_clears_balances() {
        let mut w = Witness {
            leaf_ids: vec![id(1)],
            leaf_balances: vec![50],
            reserves: vec![100],
            prev_reserves: 7,
        };
        w.zeroize();
        assert!(w.leaf_balances.iter().all(|&b| b == 0));
        assert_eq!(w.prev_reserves, 0);
    }
}
