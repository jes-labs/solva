// Package bank holds the sandbox's mock Open Banking accounts and the scenarios
// an operator can seed for deterministic demos. Balances are integer minor
// units as decimal strings, never floats.
package bank

import (
	"errors"
	"sync"
)

// ErrUnknownAccount means the account id is not registered in any mock bank.
var ErrUnknownAccount = errors.New("bank: unknown account")

// ErrUnknownScenario means the named scenario is not one the sandbox seeds.
var ErrUnknownScenario = errors.New("bank: unknown scenario")

// Account is one mock account at one bank. Balance is a decimal string of
// integer minor units.
type Account struct {
	AccountID string
	BankID    string
	Balance   string
	Currency  string
}

// Registry holds accounts keyed by account id. It is safe for concurrent use so
// the balance endpoint and the admin seeder can run together.
type Registry struct {
	mu       sync.RWMutex
	accounts map[string]Account
}

// scenarios maps a scenario name to the per-account balances it seeds. The three
// demo states from PRD 2 section 8 are solvent, near-breach, and insolvent.
// Balances are chosen relative to a fixed liability total the demo uses, so the
// orchestrator's R vs L outcome is deterministic per scenario.
var scenarios = map[string]map[string]string{
	"solvent": {
		"acct-anchor": "8000000",
		"acct-beacon": "5000000",
		"acct-cedar":  "3000000",
	},
	"near-breach": {
		"acct-anchor": "4200000",
		"acct-beacon": "3100000",
		"acct-cedar":  "2200000",
	},
	"insolvent": {
		"acct-anchor": "2000000",
		"acct-beacon": "1500000",
		"acct-cedar":  "1000000",
	},
}

// bankOfAccount maps each demo account to its mock bank.
var bankOfAccount = map[string]string{
	"acct-anchor": "bank-anchor",
	"acct-beacon": "bank-beacon",
	"acct-cedar":  "bank-cedar",
}

// NewRegistry builds a registry seeded with the solvent scenario so the sandbox
// answers balance calls immediately after boot.
func NewRegistry() *Registry {
	r := &Registry{accounts: make(map[string]Account)}
	// The solvent scenario is the safe default for a fresh sandbox.
	_ = r.Seed("solvent")
	return r
}

// Get returns the account for an id.
func (r *Registry) Get(accountID string) (Account, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	acct, ok := r.accounts[accountID]
	if !ok {
		return Account{}, ErrUnknownAccount
	}
	return acct, nil
}

// Seed replaces all account balances with the named scenario. It returns
// ErrUnknownScenario for a name the sandbox does not define.
func (r *Registry) Seed(scenario string) error {
	balances, ok := scenarios[scenario]
	if !ok {
		return ErrUnknownScenario
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.accounts = make(map[string]Account, len(balances))
	for accountID, balance := range balances {
		r.accounts[accountID] = Account{
			AccountID: accountID,
			BankID:    bankOfAccount[accountID],
			Balance:   balance,
			Currency:  "NGN",
		}
	}
	return nil
}

// Scenarios lists the scenario names the sandbox can seed.
func Scenarios() []string {
	return []string{"solvent", "near-breach", "insolvent"}
}
