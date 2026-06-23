package repo

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

// This file is the seam between sqlc's pgtype values and Solva's string-based
// domain entities. Money stays a decimal string the whole way through; it is
// never widened to a float, so reserve and liability totals round-trip exactly.

// toUUID parses a canonical UUID string into the pgtype the queries expect.
func toUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return u, fmt.Errorf("parse uuid %q: %w", s, err)
	}
	return u, nil
}

// fromUUID formats a pgtype.UUID back to the canonical 8-4-4-4-12 string.
func fromUUID(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// toNumeric parses a decimal string of integer minor units into pgtype.Numeric.
func toNumeric(s string) (pgtype.Numeric, error) {
	var n pgtype.Numeric
	if err := n.Scan(s); err != nil {
		return n, fmt.Errorf("parse numeric %q: %w", s, err)
	}
	return n, nil
}

// fromNumeric renders a pgtype.Numeric as its decimal string. pgtype.Numeric's
// driver value is already the exact text form, so no float is involved.
func fromNumeric(n pgtype.Numeric) (string, error) {
	if !n.Valid {
		return "", fmt.Errorf("numeric is null")
	}
	v, err := n.Value()
	if err != nil {
		return "", fmt.Errorf("numeric value: %w", err)
	}
	s, ok := v.(string)
	if !ok {
		return "", fmt.Errorf("numeric value was %T, want string", v)
	}
	return s, nil
}
