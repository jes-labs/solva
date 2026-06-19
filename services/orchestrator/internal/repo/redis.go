package repo

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// cycleLockTTL caps how long a cycle can hold the idempotency lock. It bounds a
// crashed cycle so the tenant is not locked out forever.
const cycleLockTTL = 15 * time.Minute

// RedisCache implements usecase.Cache: the latest-proof pointer per tenant and
// the per-tenant cycle lock.
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache parses the URL, connects, and pings once.
func NewRedisCache(ctx context.Context, url string) (*RedisCache, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}
	client := redis.NewClient(opts)
	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return &RedisCache{client: client}, nil
}

// Close releases the client.
func (c *RedisCache) Close() error {
	return c.client.Close()
}

// SetLatest points a tenant at its newest proof id.
func (c *RedisCache) SetLatest(ctx context.Context, tenantID, proofID string) error {
	if err := c.client.Set(ctx, latestKey(tenantID), proofID, 0).Err(); err != nil {
		return fmt.Errorf("set latest proof: %w", err)
	}
	return nil
}

// GetLatest reads a tenant's newest proof id. A cache miss returns an empty
// string and no error so the caller can fall back to Postgres.
func (c *RedisCache) GetLatest(ctx context.Context, tenantID string) (string, error) {
	v, err := c.client.Get(ctx, latestKey(tenantID)).Result()
	if err == redis.Nil {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("get latest proof: %w", err)
	}
	return v, nil
}

// AcquireCycleLock takes the per-tenant lock with SET NX. It returns false when
// another cycle already holds it, which is the idempotency signal.
func (c *RedisCache) AcquireCycleLock(ctx context.Context, tenantID string) (bool, error) {
	ok, err := c.client.SetNX(ctx, lockKey(tenantID), "1", cycleLockTTL).Result()
	if err != nil {
		return false, fmt.Errorf("acquire cycle lock: %w", err)
	}
	return ok, nil
}

// ReleaseCycleLock drops the per-tenant lock.
func (c *RedisCache) ReleaseCycleLock(ctx context.Context, tenantID string) error {
	if err := c.client.Del(ctx, lockKey(tenantID)).Err(); err != nil {
		return fmt.Errorf("release cycle lock: %w", err)
	}
	return nil
}

func latestKey(tenantID string) string { return "solva:latest:" + tenantID }
func lockKey(tenantID string) string   { return "solva:cyclelock:" + tenantID }

// Ensure RedisCache satisfies the cache port.
var _ usecase.Cache = (*RedisCache)(nil)
