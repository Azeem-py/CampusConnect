import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InteractionMatrix, InteractionMatrixService } from './interaction-matrix.service';

interface SvdDecomposition {
  /** U matrix: nUsers × k — each row is a user latent vector */
  U: number[][];
  /** Singular values, length k */
  S: number[];
  /** V matrix: nPosts × k — each row is a post latent vector */
  V: number[][];
  /** FIX (bonus): O(1) lookup maps instead of O(n) indexOf */
  userIdxMap: Map<string, number>;
  postIdxMap: Map<string, number>;
}

/** Stored rank-1 updates for sparse deflation. */
interface SingularTriplet {
  u: number[];
  s: number;
  v: number[];
}

/**
 * SVD collaborative filtering — fully rewritten.
 *
 * Fixes applied:
 *   C4 — Dense matrix eliminated: all matrix-vector products are computed
 *        directly on the sparse InteractionMatrix. Memory usage drops from
 *        O(nUsers × nPosts) to O(nnz + k × (nUsers + nPosts)).
 *   H3 — Event loop blocking eliminated: `decompose()` is now async and
 *        yields to the event loop via `setImmediate` between each of the k
 *        singular vector computations.
 *   L3 — Removed `__` throwaway variable.
 *   Bonus — O(1) predict() via Map lookups (was O(n) indexOf).
 */
@Injectable()
export class SvdService {
  private readonly logger = new Logger(SvdService.name);
  private decomposition: SvdDecomposition | null = null;
  private recomputePromise: Promise<void> | null = null;

  /** Latent factor count. */
  private readonly K = 20;
  /** Power-iteration steps per singular vector. */
  private readonly MAX_ITER = 50;

  constructor(private readonly matrixService: InteractionMatrixService) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns the predicted interaction score for (userId, postId).
   * O(k) dot product; O(1) index lookup via Map.
   */
  predict(userId: string, postId: string): number {
    if (!this.decomposition) return 0;
    const { U, S, V, userIdxMap, postIdxMap } = this.decomposition;
    const ui = userIdxMap.get(userId);
    const pi = postIdxMap.get(postId);
    if (ui === undefined || pi === undefined) return 0;

    let score = 0;
    for (let i = 0; i < S.length; i++) {
      const contribution = U[ui][i] * S[i] * V[pi][i];
      if (Number.isFinite(contribution)) score += contribution;
    }
    return score;
  }

  /** Returns all post IDs known to the current decomposition. */
  getPostIds(): string[] {
    return this.decomposition
      ? [...this.decomposition.postIdxMap.keys()]
      : [];
  }

  // ─── Recomputation Cron ──────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async recompute(): Promise<void> {
    if (this.recomputePromise) return this.recomputePromise;
    this.recomputePromise = this.doRecompute().finally(() => {
      this.recomputePromise = null;
    });
    return this.recomputePromise;
  }

  private async doRecompute(): Promise<void> {
    const matrix = await this.matrixService.getMatrix();
    if (matrix.size === 0) return;

    this.logger.log('SVD: Starting decomposition...');
    const start = Date.now();
    this.decomposition = await this.decompose(matrix);
    this.logger.log(`SVD: Decomposition complete in ${Date.now() - start}ms`);
  }

  // ─── Sparse SVD Implementation ───────────────────────────────────────────────

  private async decompose(matrix: InteractionMatrix): Promise<SvdDecomposition> {
    const userIds = [...matrix.keys()];
    const postIdSet = new Set<string>();
    matrix.forEach((row) => row.forEach((_, pid) => postIdSet.add(pid)));
    const postIds = [...postIdSet];

    const nUsers = userIds.length;
    const nPosts = postIds.length;
    const k = Math.min(this.K, nUsers, nPosts);

    const postIdxMap = new Map(postIds.map((pid, i) => [pid, i]));
    const userIdxMap = new Map(userIds.map((uid, i) => [uid, i]));

    // FIX C4: Compute per-user means WITHOUT materialising a dense matrix
    const userMeans = this.computeUserMeans(matrix);

    // Pre-allocate result matrices in user/post-major order
    const Ufinal: number[][] = Array.from({ length: nUsers }, () =>
      new Array(k).fill(0),
    );
    const S: number[] = new Array(k).fill(0);
    const Vfinal: number[][] = Array.from({ length: nPosts }, () =>
      new Array(k).fill(0),
    );

    // Deflation history — rank-1 updates, O(k × (nUsers + nPosts)) total
    const deflations: SingularTriplet[] = [];

    for (let ki = 0; ki < k; ki++) {
      const { u, s, v } = this.powerIteration(
        matrix,
        userIds,
        postIds,
        postIdxMap,
        nUsers,
        nPosts,
        userMeans,
        deflations,
      );

      u.forEach((val, ui) => (Ufinal[ui][ki] = val));
      v.forEach((val, pi) => (Vfinal[pi][ki] = val));
      S[ki] = s;
      deflations.push({ u, s, v });

      // FIX H3: Yield to event loop between each singular vector so HTTP
      // requests are not starved during the Cron recomputation.
      await new Promise<void>((resolve) => setImmediate(resolve));
    }

    return { U: Ufinal, S, V: Vfinal, userIdxMap, postIdxMap };
  }

  // ─── Power Iteration (operates on sparse matrix) ─────────────────────────────

  private powerIteration(
    matrix: InteractionMatrix,
    userIds: string[],
    postIds: string[],
    postIdxMap: Map<string, number>,
    nUsers: number,
    nPosts: number,
    userMeans: Map<string, number>,
    deflations: SingularTriplet[],
  ): { u: number[]; s: number; v: number[] } {
    let v = this.normalise(
      Array.from({ length: nPosts }, () => Math.random() - 0.5),
    );
    let u: number[] = new Array(nUsers).fill(0);
    let s = 0;

    for (let iter = 0; iter < this.MAX_ITER; iter++) {
      // u = M_centered × v  (sparse, deflated)
      const uRaw = this.sparseMv(matrix, userIds, postIdxMap, userMeans, v, deflations);
      s = this.l2Norm(uRaw);
      if (s < 1e-10 || !Number.isFinite(s)) break;
      u = uRaw.map((x) => x / s);

      // v = M_centered^T × u  (sparse, deflated)
      const vRaw = this.sparseMtv(matrix, userIds, postIds, postIdxMap, userMeans, u, deflations);
      const vNorm = this.l2Norm(vRaw);
      if (vNorm < 1e-10 || !Number.isFinite(vNorm)) break;
      v = vRaw.map((x) => x / vNorm);
    }

    return { u, s, v };
  }

  // ─── Sparse Matrix-Vector Products ──────────────────────────────────────────

  /**
   * Computes (M_centered_deflated) × v in O(nnz + k × nUsers).
   * M_centered[i][j] = (raw[i][j] - mean_i) for non-zero entries.
   */
  private sparseMv(
    matrix: InteractionMatrix,
    userIds: string[],
    postIdxMap: Map<string, number>,
    userMeans: Map<string, number>,
    v: number[],
    deflations: SingularTriplet[],
  ): number[] {
    // Sparse part: M_centered × v
    const result = userIds.map((uid) => {
      const row = matrix.get(uid);
      if (!row || row.size === 0) return 0;
      const mean = userMeans.get(uid) ?? 0;
      let dotRaw = 0;
      let dotRatedV = 0;
      row.forEach((val, pid) => {
        const j = postIdxMap.get(pid);
        if (j !== undefined) {
          dotRaw += val * v[j];
          dotRatedV += v[j];
        }
      });
      return dotRaw - mean * dotRatedV;
    });

    // Deflation: subtract s_i × u_i × (v_i · v)
    deflations.forEach(({ u: ui, s: si, v: vi }) => {
      const d = this.dot(vi, v);
      ui.forEach((val, i) => { result[i] -= si * val * d; });
    });

    return result;
  }

  /**
   * Computes (M_centered_deflated)^T × u in O(nnz + k × nPosts).
   */
  private sparseMtv(
    matrix: InteractionMatrix,
    userIds: string[],
    postIds: string[],
    postIdxMap: Map<string, number>,
    userMeans: Map<string, number>,
    u: number[],
    deflations: SingularTriplet[],
  ): number[] {
    // Sparse part: M_centered^T × u
    const result = new Array(postIds.length).fill(0);
    userIds.forEach((uid, i) => {
      const row = matrix.get(uid);
      if (!row || row.size === 0) return;
      const mean = userMeans.get(uid) ?? 0;
      row.forEach((val, pid) => {
        const j = postIdxMap.get(pid);
        if (j !== undefined) result[j] += (val - mean) * u[i];
      });
    });

    // Deflation: subtract s_i × v_i × (u_i · u)
    deflations.forEach(({ u: ui, s: si, v: vi }) => {
      const d = this.dot(ui, u);
      vi.forEach((val, j) => { result[j] -= si * val * d; });
    });

    return result;
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private computeUserMeans(matrix: InteractionMatrix): Map<string, number> {
    const means = new Map<string, number>();
    matrix.forEach((row, uid) => {
      if (row.size === 0) return;
      const sum = [...row.values()].reduce((a, b) => a + b, 0);
      means.set(uid, sum / row.size);
    });
    return means;
  }

  private dot(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private l2Norm(v: number[]): number {
    return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  }

  private normalise(v: number[]): number[] {
    const norm = this.l2Norm(v);
    return norm < 1e-10 ? v : v.map((x) => x / norm);
  }
}
