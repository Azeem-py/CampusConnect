import { Injectable } from '@nestjs/common';
import { InteractionMatrix, InteractionMatrixService } from './interaction-matrix.service';

interface NeighborEntry {
  userId: string;
  similarity: number;
}

/**
 * KNN user-based collaborative filtering.
 *
 * Fixes applied:
 *   C3  — `scoreMany()` replaces the per-post `score()` approach: the matrix
 *          and neighbor list are fetched ONCE per request, not once per post.
 *   H4  — `neighborCache` is now bounded to MAX_CACHE_ENTRIES; oldest entries
 *          are evicted when the cap is exceeded (insertion-order eviction via
 *          Map's guaranteed iteration order).
 *   M5  — The inner scoring loop is synchronous; async only at the boundary.
 */
@Injectable()
export class KnnService {
  private readonly K_NEIGHBORS = 10;
  private readonly CACHE_TTL_MS = 10 * 60 * 1_000; // 10 minutes
  private readonly MAX_CACHE_ENTRIES = 500;          // FIX H4: bounded size

  private neighborCache = new Map<
    string,
    { neighbors: NeighborEntry[]; builtAt: number }
  >();

  constructor(private readonly matrixService: InteractionMatrixService) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * FIX C3 — Scores all `postIds` for `userId` in a single pass.
   * Matrix and neighbors are fetched once, then reused across all posts.
   * Returns Map<postId, score> for O(1) lookup in the hybrid ranker.
   */
  async scoreMany(
    userId: string,
    postIds: string[],
  ): Promise<Map<string, number>> {
    const matrix = await this.matrixService.getMatrix();
    const neighbors = await this.getNeighbors(userId, matrix);
    const scores = new Map<string, number>();
    postIds.forEach((postId) => {
      scores.set(postId, this.aggregateScore(neighbors, postId, matrix));
    });
    return scores;
  }

  /**
   * Returns the top-K neighbor entries for a user (cached).
   * The optional `matrix` argument avoids a second `getMatrix()` call when
   * the caller already holds a reference.
   */
  async getNeighbors(
    userId: string,
    matrix?: InteractionMatrix,
  ): Promise<NeighborEntry[]> {
    const cached = this.neighborCache.get(userId);
    const lastInvalidatedAt = this.matrixService.lastInvalidatedAt ?? 0;
    if (
      cached &&
      cached.builtAt >= lastInvalidatedAt &&
      Date.now() - cached.builtAt < this.CACHE_TTL_MS
    ) {
      return cached.neighbors;
    }

    const mat = matrix ?? (await this.matrixService.getMatrix());
    const neighbors = this.computeNeighbors(userId, mat);

    this.neighborCache.set(userId, { neighbors, builtAt: Date.now() });
    this.evictIfNeeded(); // FIX H4: enforce size cap
    return neighbors;
  }

  /**
   * FIX H4 — Clears all cached neighbor lists.
   * Call this whenever the interaction matrix is invalidated.
   */
  clearCache(): void {
    this.neighborCache.clear();
  }

  // ─── Core Computation ────────────────────────────────────────────────────────

  private computeNeighbors(
    userId: string,
    matrix: InteractionMatrix,
  ): NeighborEntry[] {
    const userVec = matrix.get(userId);
    if (!userVec || userVec.size === 0) return [];

    // 1. Build a local inverted index mapping: postId -> userIds
    const postToUsers = new Map<string, string[]>();
    matrix.forEach((otherVec, otherId) => {
      otherVec.forEach((_, pid) => {
        if (!postToUsers.has(pid)) postToUsers.set(pid, []);
        postToUsers.get(pid)!.push(otherId);
      });
    });

    // 2. Identify candidate users who have rated at least one post in common with target user
    const candidateUserIds = new Set<string>();
    userVec.forEach((_, pid) => {
      const usersWhoInteracted = postToUsers.get(pid);
      if (usersWhoInteracted) {
        usersWhoInteracted.forEach((otherId) => {
          if (otherId !== userId) {
            candidateUserIds.add(otherId);
          }
        });
      }
    });

    // 3. Only calculate cosine similarity for overlapping candidate users
    const similarities: NeighborEntry[] = [];
    candidateUserIds.forEach((otherId) => {
      const otherVec = matrix.get(otherId);
      if (!otherVec) return;
      const sim = this.cosineSimilarity(userVec, otherVec);
      if (sim > 0) similarities.push({ userId: otherId, similarity: sim });
    });

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, this.K_NEIGHBORS);
  }

  private aggregateScore(
    neighbors: NeighborEntry[],
    postId: string,
    matrix: InteractionMatrix,
  ): number {
    let weightedSum = 0;
    let simSum = 0;

    neighbors.forEach(({ userId, similarity }) => {
      const rating = matrix.get(userId)?.get(postId);
      if (rating !== undefined) {
        weightedSum += similarity * rating;
        simSum += Math.abs(similarity);
      }
    });

    return simSum === 0 ? 0 : weightedSum / simSum;
  }

  // ─── Cache Eviction ──────────────────────────────────────────────────────────

  /**
   * FIX H4 — Evicts the oldest entries when the cache exceeds the size cap.
   * Uses Map's guaranteed insertion-order iteration to find the oldest keys.
   */
  private evictIfNeeded(): void {
    if (this.neighborCache.size <= this.MAX_CACHE_ENTRIES) return;
    const toDelete = this.neighborCache.size - this.MAX_CACHE_ENTRIES;
    let deleted = 0;
    for (const key of this.neighborCache.keys()) {
      if (deleted >= toDelete) break;
      this.neighborCache.delete(key);
      deleted++;
    }
  }

  // ─── Math ─────────────────────────────────────────────────────────────────────

  private cosineSimilarity(
    a: Map<string, number>,
    b: Map<string, number>,
  ): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    // Iterate the smaller vector to minimise ops
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    small.forEach((w, term) => {
      dot += w * (large.get(term) ?? 0);
    });
    a.forEach((w) => (normA += w * w));
    b.forEach((w) => (normB += w * w));

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}
