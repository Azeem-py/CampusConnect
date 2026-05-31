import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/** A post's TF-IDF vector: term → weight */
export type TermVector = Map<string, number>;

/**
 * TF-IDF content-based filtering.
 *
 * Fixes applied:
 *   C2 — Atomic state swap + concurrent build lock: the old `postVectors` is
 *        never partially replaced; a new map is built locally and swapped in
 *        one assignment only after the build completes successfully.
 *   H7 — Removed unused `TfIdfPost` interface.
 *   L1 — Removed unused `idf` field.
 */
@Injectable()
export class TfidfService {
  constructor(private readonly prisma: PrismaService) {}

  /** Indexed post vectors, rebuilt hourly. */
  private postVectors: Map<string, TermVector> = new Map();

  /**
   * FIX C2 — Build lock: if corpus is already being built (e.g. startup +
   * Cron firing at the same time), concurrent callers await the same Promise.
   */
  private buildPromise: Promise<void> | null = null;

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns cosine similarity between the user's profile vector and a post.
   * Scores are in [0, 1]; higher = more relevant.
   */
  scorePost(userProfileVector: TermVector, postId: string): number {
    const postVec = this.postVectors.get(postId);
    if (!postVec || userProfileVector.size === 0) return 0;
    return this.cosineSimilarity(userProfileVector, postVec);
  }

  /**
   * Builds a user interest profile vector by summing TF-IDF vectors of posts
   * the user has interacted with, enriched with their explicit interests & hobbies.
   */
  buildUserProfile(
    interactedPostIds: string[],
    interests?: string | null,
    hobby?: string | null,
  ): TermVector {
    const profile: TermVector = new Map();

    // 1. Incorporate interacted posts if they exist
    if (this.postVectors.size > 0 && interactedPostIds.length > 0) {
      const postInteractionAccum: TermVector = new Map();
      interactedPostIds.forEach((postId) => {
        const vec = this.postVectors.get(postId);
        if (!vec) return;
        vec.forEach((weight, term) => {
          postInteractionAccum.set(term, (postInteractionAccum.get(term) ?? 0) + weight);
        });
      });

      // Calculate L2 norm of the accumulated vector to scale-normalise it
      let normSq = 0;
      postInteractionAccum.forEach((w) => {
        normSq += w * w;
      });
      const norm = Math.sqrt(normSq);

      if (norm > 0) {
        postInteractionAccum.forEach((w, term) => {
          profile.set(term, w / norm);
        });
      }
    }

    // 2. Incorporate explicit interests & hobbies
    const rawTokens: string[] = [];
    if (interests) {
      interests.split(',').forEach((val) => {
        rawTokens.push(...this.tokenize(val));
      });
    }
    if (hobby) {
      hobby.split(',').forEach((val) => {
        rawTokens.push(...this.tokenize(val));
      });
    }

    // Give high importance to explicit user choices
    // We assign a fixed weight boost (+1.5) relative to the scale-normalised L2 vector.
    rawTokens.forEach((token) => {
      profile.set(token, (profile.get(token) ?? 0) + 1.5);
    });

    return profile;
  }

  /** Returns all post IDs currently indexed in the corpus. */
  getAllPostIds(): string[] {
    return [...this.postVectors.keys()];
  }

  get isReady(): boolean {
    return this.postVectors.size > 0;
  }

  // ─── Corpus Building ─────────────────────────────────────────────────────────

  /**
   * Rebuilds the corpus every hour.
   * FIX C2: Concurrent calls (startup + Cron) share the same in-flight Promise.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async buildCorpus(): Promise<void> {
    if (this.buildPromise) return this.buildPromise;
    this.buildPromise = this.doBuildCorpus().finally(() => {
      this.buildPromise = null;
    });
    return this.buildPromise;
  }

  private async doBuildCorpus(): Promise<void> {
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        content: true,
        courseCode: true,
        author: { select: { department: true, major: true } },
      },
    });

    const N = posts.length;
    if (N === 0) return;

    // Step 1: Tokenize + build raw TF and DF
    const rawTf = new Map<string, Map<string, number>>();
    const df = new Map<string, number>();

    posts.forEach(({ id, title, content, courseCode, author }) => {
      const text = [
        title ?? '',
        content,
        courseCode ?? '',
        author.department ?? '',
        author.major ?? '',
      ].join(' ');

      const termCounts = new Map<string, number>();
      this.tokenize(text).forEach((t) =>
        termCounts.set(t, (termCounts.get(t) ?? 0) + 1),
      );
      rawTf.set(id, termCounts);
      termCounts.forEach((_, term) => df.set(term, (df.get(term) ?? 0) + 1));
    });

    // Step 2: IDF
    const idfMap = new Map<string, number>();
    df.forEach((docCount, term) =>
      idfMap.set(term, Math.log((N + 1) / (docCount + 1)) + 1),
    );

    // Step 3: TF-IDF vectors — built into a LOCAL map first
    const vectors = new Map<string, TermVector>();
    rawTf.forEach((termCounts, postId) => {
      const totalTerms = [...termCounts.values()].reduce((a, b) => a + b, 0);
      const vec: TermVector = new Map();
      termCounts.forEach((count, term) => {
        vec.set(term, (count / totalTerms) * (idfMap.get(term) ?? 0));
      });
      vectors.set(postId, vec);
    });

    // FIX C2 — Atomic swap: only ONE assignment, happens after full success.
    this.postVectors = vectors;
  }

  // ─── Math Utilities ──────────────────────────────────────────────────────────

  private cosineSimilarity(a: TermVector, b: TermVector): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    a.forEach((w, term) => {
      dot += w * (b.get(term) ?? 0);
      normA += w * w;
    });
    b.forEach((w) => (normB += w * w));

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  }
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
  'its', 'new', 'now', 'old', 'see', 'two', 'who', 'did', 'let', 'may',
  'use', 'she', 'way', 'from', 'this', 'that', 'with', 'have', 'more',
  'will', 'your', 'they', 'been', 'into', 'than', 'then', 'when', 'also',
  'each', 'just', 'like', 'make', 'many', 'over', 'such', 'take', 'very',
  'well', 'what', 'where', 'which', 'while', 'time', 'these', 'those',
]);
