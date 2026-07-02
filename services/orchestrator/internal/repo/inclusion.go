package repo

import "strings"

// The prover's serialized Merkle Sum Tree (services/prover/src/proving.rs
// serialize_tree). The orchestrator only decodes and forwards it; it never
// recomputes a hash, so there is no second Poseidon2 implementation in Go.

type serializedPathNode struct {
	Hash          string `json:"hash"`
	Sum           string `json:"sum"`
	SiblingIsLeft bool   `json:"sibling_is_left"`
}

type serializedLeaf struct {
	IDHash  string               `json:"id_hash"`
	Balance string               `json:"balance"`
	Path    []serializedPathNode `json:"path"`
}

type serializedTree struct {
	RootHash string           `json:"root_hash"`
	Leaves   []serializedLeaf `json:"leaves"`
}

// findLeaf returns the leaf for a customer id hash, matching on the bare hex so
// callers may pass it with or without a 0x prefix and in any case.
func (t serializedTree) findLeaf(idHash string) (serializedLeaf, bool) {
	want := normalizeHex(idHash)
	for _, leaf := range t.Leaves {
		if normalizeHex(leaf.IDHash) == want {
			return leaf, true
		}
	}
	return serializedLeaf{}, false
}

func normalizeHex(s string) string {
	return strings.TrimPrefix(strings.ToLower(s), "0x")
}
