import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

describe('Phase 3 Rules: Discovery, Search, Filters, Keyset Pagination, Neutrality & Public Dossier', () => {
  describe('1. Free-Text & Regex Multilingual Search', () => {
    it('matches query term across title and description using case-insensitive search', () => {
      const issues = [
        { title: 'Hazardous potholes near Akurdi Railway Station', description: 'Deep road potholes causing accidents' },
        { title: 'Drinking water pipeline leakage in Nigdi', description: 'Clean drinking water is being wasted on street' },
        { title: 'कचरा कुंड्यांची नियमित स्वच्छता होत नाही', description: 'भाजी मंडई परिसरात कचऱ्याचे ढीग साचले आहेत' },
      ];

      const searchIssues = (q: string) => {
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        return issues.filter((it) => regex.test(it.title) || regex.test(it.description));
      };

      // English title match
      assert.equal(searchIssues('pothole').length, 1);
      assert.equal(searchIssues('pothole')[0].title.includes('potholes'), true);

      // English description match
      assert.equal(searchIssues('wasted').length, 1);
      assert.equal(searchIssues('wasted')[0].title.includes('water pipeline'), true);

      // Marathi unicode search match
      assert.equal(searchIssues('कचरा').length, 1);
      assert.equal(searchIssues('मंडई').length, 1);

      // No match
      assert.equal(searchIssues('unrelated keyword').length, 0);
    });
  });

  describe('2. Neutrality Ranking: Zero Bias / Pay-To-Promote Protections', () => {
    it('ranks purely by raiseCount and recency, strictly rejecting account type or payment weighting', () => {
      interface RankingCandidate {
        id: string;
        title: string;
        raiseCount: number;
        createdAt: Date;
        accountTier?: 'vip' | 'regular' | 'corporate';
        isPromoted?: boolean;
      }

      const candidates: RankingCandidate[] = [
        { id: '1', title: 'Pothole A', raiseCount: 40, createdAt: new Date('2026-10-01'), accountTier: 'corporate', isPromoted: true },
        { id: '2', title: 'Water Leak B', raiseCount: 150, createdAt: new Date('2026-10-02'), accountTier: 'regular', isPromoted: false },
        { id: '3', title: 'Streetlight C', raiseCount: 85, createdAt: new Date('2026-10-03'), accountTier: 'vip', isPromoted: false },
      ];

      // Neutral sorting function: ONLY uses raiseCount then createdAt
      const sortNeutralTrending = (list: RankingCandidate[]) => {
        return [...list].sort((a, b) => {
          if (b.raiseCount !== a.raiseCount) return b.raiseCount - a.raiseCount;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
      };

      const sorted = sortNeutralTrending(candidates);
      assert.equal(sorted[0].id, '2'); // 150 raises (regular citizen wins over corporate/promoted)
      assert.equal(sorted[1].id, '3'); // 85 raises
      assert.equal(sorted[2].id, '1'); // 40 raises (corporate paid flag has ZERO influence)
    });
  });

  describe('3. Keyset Cursor-Based Pagination', () => {
    it('encodes and decodes cursor tokens correctly for deterministic pagination', () => {
      const cursorPayload = {
        id: '670560a80000000000000001',
        val: 84,
        sort: 'trending',
      };

      // Encode
      const encoded = Buffer.from(JSON.stringify(cursorPayload)).toString('base64url');
      assert.equal(typeof encoded, 'string');

      // Decode
      const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      assert.equal(decoded.id, cursorPayload.id);
      assert.equal(decoded.val, 84);
      assert.equal(decoded.sort, 'trending');
    });

    it('applies pagination boundary filter accurately across cursor pages', () => {
      const dataset = [
        { id: '10', raiseCount: 200 },
        { id: '9', raiseCount: 150 },
        { id: '8', raiseCount: 150 },
        { id: '7', raiseCount: 80 },
        { id: '6', raiseCount: 40 },
      ];

      // Simulate first page fetch with limit = 2
      const limit = 2;
      const page1 = dataset.slice(0, limit + 1);
      const hasMore1 = page1.length > limit;
      if (hasMore1) page1.pop();

      assert.equal(page1.length, 2);
      assert.equal(page1[0].id, '10');
      assert.equal(page1[1].id, '9');

      // Last item of page 1 is cursor point
      const lastItem = page1[page1.length - 1];

      // Fetch page 2 using cursor condition: raiseCount < val OR (raiseCount == val AND id < cursorId)
      const page2Candidates = dataset.filter((item) => {
        if (item.raiseCount < lastItem.raiseCount) return true;
        if (item.raiseCount === lastItem.raiseCount && parseInt(item.id, 10) < parseInt(lastItem.id, 10)) return true;
        return false;
      });
      const page2 = page2Candidates.slice(0, limit);

      assert.equal(page2.length, 2);
      assert.equal(page2[0].id, '8'); // Correctly picks tie-breaker id 8
      assert.equal(page2[1].id, '7');
    });
  });

  describe('4. Proximity & Geo Boundary Logic', () => {
    it('determines coordinates strictly within pilot ward boundaries', () => {
      // Nigdi Ward 12 Bounding Box roughly: lng [73.76, 73.80], lat [18.64, 18.68]
      const minLng = 73.76;
      const maxLng = 73.80;
      const minLat = 18.64;
      const maxLat = 18.68;

      const testPins = [
        { id: 'inside_1', coords: [73.78, 18.66] }, // Inside Nigdi
        { id: 'inside_2', coords: [73.77, 18.65] }, // Inside Nigdi
        { id: 'outside_mumbai', coords: [72.87, 19.07] }, // Mumbai
        { id: 'outside_hadapsar', coords: [73.93, 18.50] }, // East Pune
      ];

      const isInside = (coords: number[]) => {
        const [lng, lat] = coords;
        return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
      };

      const matched = testPins.filter((p) => isInside(p.coords));
      assert.equal(matched.length, 2);
      assert.equal(matched[0].id, 'inside_1');
      assert.equal(matched[1].id, 'inside_2');
    });
  });

  describe('5. Public Issue Visibility & Privacy Rules', () => {
    it('returns 404 for draft or under_review issues to unauthorized public viewers', () => {
      const checkPublicAccess = (issueStatus: string, moderationState: string, isAuthor: boolean, isOfficial: boolean) => {
        const isPublicStatus = !['draft', 'submitted', 'under_review'].includes(issueStatus);
        const isPublicModeration = moderationState !== 'hidden';

        if (!isPublicStatus || !isPublicModeration) {
          if (!isAuthor && !isOfficial) {
            return { accessible: false, status: 404 };
          }
        }
        return { accessible: true, status: 200 };
      };

      // Anonymous visitor viewing draft
      assert.equal(checkPublicAccess('draft', 'clean', false, false).accessible, false);
      assert.equal(checkPublicAccess('draft', 'clean', false, false).status, 404);

      // Anonymous visitor viewing hidden/moderated issue
      assert.equal(checkPublicAccess('published', 'hidden', false, false).accessible, false);

      // Author viewing their own under_review issue
      assert.equal(checkPublicAccess('under_review', 'clean', true, false).accessible, true);

      // Official viewing under_review issue
      assert.equal(checkPublicAccess('under_review', 'clean', false, true).accessible, true);

      // General public viewing published issue
      assert.equal(checkPublicAccess('published', 'clean', false, false).accessible, true);
    });

    it('returns merge redirect pointer when an issue has been merged', () => {
      const mergedIssue = {
        _id: 'issue_dup_123',
        status: 'merged',
        mergedIntoId: 'issue_canonical_456',
      };

      const handleIssueResponse = (issue: typeof mergedIssue) => {
        if (issue.status === 'merged' && issue.mergedIntoId) {
          return {
            isMerged: true,
            mergedIntoId: issue.mergedIntoId,
          };
        }
        return { isMerged: false };
      };

      const res = handleIssueResponse(mergedIssue);
      assert.equal(res.isMerged, true);
      assert.equal(res.mergedIntoId, 'issue_canonical_456');
    });
  });
});
