package bank

import (
	"encoding/json"
	"fmt"
)

// CanonicalPayload serializes the signed balance fields in a fixed key order.
// It must match the orchestrator's banks.canonicalPayload exactly: keys sorted,
// the signature field excluded. Any divergence breaks every signature.
func CanonicalPayload(sourceID, balance, currency, asOf string) ([]byte, error) {
	signed := struct {
		AsOf     string `json:"as_of"`
		Balance  string `json:"balance"`
		Currency string `json:"currency"`
		SourceID string `json:"source_id"`
	}{
		AsOf:     asOf,
		Balance:  balance,
		Currency: currency,
		SourceID: sourceID,
	}
	out, err := json.Marshal(signed)
	if err != nil {
		return nil, fmt.Errorf("marshal canonical payload: %w", err)
	}
	return out, nil
}
