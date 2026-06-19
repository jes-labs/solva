package entity

// PathNode is one sibling step on a Merkle Sum Tree inclusion path. The hash
// is hex and is produced by the prover, never recomputed in Go. Sum is a
// decimal string of integer minor units carried alongside the sibling.
type PathNode struct {
	// Hash is the sibling node hash, hex.
	Hash string
	// Sum is the sibling subtree balance sum, decimal string.
	Sum string
	// Left reports whether the sibling sits on the left of the current node.
	Left bool
}

// InclusionRef is a customer's proof that their balance is committed in a
// published proof's tree. Balance is a decimal string of integer minor units.
type InclusionRef struct {
	// ProofID is the proof whose tree contains the leaf.
	ProofID string
	// CustomerIDHash is the Poseidon2 hash of the external reference, hex.
	CustomerIDHash string
	// Balance is the committed leaf balance, decimal string.
	Balance string
	// Path is the sibling path from the leaf to the root.
	Path []PathNode
	// RootHash is the expected Poseidon2 sum-tree root, hex.
	RootHash string
}
