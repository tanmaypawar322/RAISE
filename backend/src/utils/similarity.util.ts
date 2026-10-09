/**
 * Similarity Utility for duplicate detection
 * Fast token-overlap (Jaccard) scoring and spatial-distance combined ranking
 */
export class SimilarityUtil {
  private static STOP_WORDS = new Set([
    // English
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
    'this', 'that', 'near', 'and', 'or', 'road', 'street',
    // Marathi & Hindi common stops
    'आणि', 'व', 'च्या', 'चे', 'ची', 'ला', 'मध्ये', 'येथे', 'आहे', 'आहेत', 'का', 'के', 'की', 'में', 'पर', 'से', 'है', 'हैं'
  ]);

  /**
   * Tokenizes and normalizes text into word stems/tokens
   */
  static tokenize(text: string): Set<string> {
    if (!text) return new Set();
    const tokens = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && !this.STOP_WORDS.has(t));

    return new Set(tokens);
  }

  /**
   * Calculates Jaccard token similarity (0.0 to 1.0)
   */
  static jaccardSimilarity(textA: string, textB: string): number {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);

    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) {
        intersectionCount++;
      }
    }

    const unionSize = tokensA.size + tokensB.size - intersectionCount;
    if (unionSize <= 0) return 0.0;

    return Number((intersectionCount / unionSize).toFixed(4));
  }

  /**
   * Combined similarity score based on text similarity and geographic proximity
   * @param textScore Jaccard similarity (0.0 to 1.0)
   * @param distanceMeters Haversine distance in meters
   * @param maxRadiusMeters Maximum search radius (e.g. 100m - 500m)
   */
  static calculateCombinedScore(
    textScore: number,
    distanceMeters: number,
    maxRadiusMeters: number = 200
  ): number {
    const distanceScore = Math.max(0, 1 - distanceMeters / maxRadiusMeters);
    // Weight text overlap 60% and geographic proximity 40%
    const combined = 0.6 * textScore + 0.4 * distanceScore;
    return Number(combined.toFixed(4));
  }
}
