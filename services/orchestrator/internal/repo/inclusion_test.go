package repo

import (
	"encoding/json"
	"testing"
)

// A serialized tree exactly as services/prover/src/proving.rs serialize_tree
// emits it: 0x-prefixed hex, decimal string sums, snake_case keys.
const sampleTreeJSON = `{
  "root_hash": "0x0e36888d7cade7e79309cd7e58109611104c225f2fcd5a158c662debb173572f",
  "leaves": [
    {
      "id_hash": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "balance": "10",
      "path": [
        {"hash": "0x00aa", "sum": "20", "sibling_is_left": false},
        {"hash": "0x00bb", "sum": "70", "sibling_is_left": false}
      ]
    },
    {
      "id_hash": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "balance": "20",
      "path": [
        {"hash": "0x00cc", "sum": "10", "sibling_is_left": true}
      ]
    }
  ]
}`

func parseSample(t *testing.T) serializedTree {
	t.Helper()
	var tree serializedTree
	if err := json.Unmarshal([]byte(sampleTreeJSON), &tree); err != nil {
		t.Fatalf("unmarshal sample tree: %v", err)
	}
	return tree
}

func TestFindLeafMatchesRegardlessOfPrefixOrCase(t *testing.T) {
	tree := parseSample(t)

	for _, want := range []string{
		"0x0000000000000000000000000000000000000000000000000000000000000001",
		"0000000000000000000000000000000000000000000000000000000000000001",
		"0X0000000000000000000000000000000000000000000000000000000000000001",
	} {
		leaf, ok := tree.findLeaf(want)
		if !ok {
			t.Fatalf("findLeaf(%q) not found", want)
		}
		if leaf.Balance != "10" {
			t.Fatalf("balance = %q, want 10", leaf.Balance)
		}
		if len(leaf.Path) != 2 {
			t.Fatalf("path len = %d, want 2", len(leaf.Path))
		}
		if leaf.Path[0].Hash != "0x00aa" || leaf.Path[0].Sum != "20" || leaf.Path[0].SiblingIsLeft {
			t.Fatalf("path[0] = %+v", leaf.Path[0])
		}
	}
}

func TestFindLeafSiblingSide(t *testing.T) {
	tree := parseSample(t)
	leaf, ok := tree.findLeaf("0x0000000000000000000000000000000000000000000000000000000000000002")
	if !ok {
		t.Fatal("leaf 2 not found")
	}
	if !leaf.Path[0].SiblingIsLeft {
		t.Fatal("leaf 2 path[0] should have sibling on the left")
	}
}

func TestFindLeafMissing(t *testing.T) {
	tree := parseSample(t)
	if _, ok := tree.findLeaf("0xdead"); ok {
		t.Fatal("expected no leaf for unknown id hash")
	}
}
