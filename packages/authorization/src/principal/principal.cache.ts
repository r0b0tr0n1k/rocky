/**
 * Principal Cache
 *
 * @description In-memory cache for resolved Principals.
 * Reduces database queries from 4-table JOIN per request to cache hit.
 *
 * Cache key: userId (auth_user_id mapped to sm_user_id)
 * TTL: 5 minutes
 * Invalidation: On role changes, the cache entry is cleared.
 *
 * For production multi-instance deployments, replace with Redis:
 *   const cached = await redis.get(`principal:${userId}`);
 *   if (cached) return Principal.fromJSON(JSON.parse(cached));
 */

import { Injectable, Logger } from "@nestjs/common";
import type { Principal } from "./principal.js";

export interface CachedPrincipal {
  principal: Principal;
  expiresAt: number;
}

@Injectable()
export class PrincipalCache {
  private readonly logger = new Logger(PrincipalCache.name);
  private readonly cache = new Map<string, CachedPrincipal>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  /** Get cached Principal, or null if expired/missing */
  get(userId: string): Principal | null {
    const entry = this.cache.get(userId);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    this.logger.debug(`Principal cache hit for user ${userId}`);
    return entry.principal;
  }

  /** Store Principal in cache */
  set(userId: string, principal: Principal): void {
    this.cache.set(userId, {
      principal,
      expiresAt: Date.now() + this.ttlMs,
    });
    this.logger.debug(`Principal cached for user ${userId}`);
  }

  /** Invalidate cache entry for a user (call when roles change) */
  invalidate(userId: string): void {
    this.cache.delete(userId);
    this.logger.debug(`Principal cache invalidated for user ${userId}`);
  }

  /** Clear all cache entries (e.g., after bulk role changes) */
  clear(): void {
    this.cache.clear();
    this.logger.debug("Principal cache cleared");
  }

  /** Get cache statistics */
  stats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
