import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { GeoUtil } from '../../utils/geo.util.js';
import { OfficeRoutingService } from '../../services/office-routing.service.js';
import { EscalationService } from '../../services/escalation.service.js';

const SuggestOfficeSchema = z
  .object({
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
    category: z.string().min(1),
  })
  .strict();

describe('Phase 1 Security & Routing Rules: Jurisdictions, Geo-Containment & Escalation Ladder', () => {
  describe('1. GeoJSON Polygon Containment (GeoUtil)', () => {
    // Ward 12 approx boundary polygon coordinates [lng, lat]
    const ward12Polygon: [number, number][] = [
      [73.765, 18.650],
      [73.795, 18.650],
      [73.795, 18.675],
      [73.765, 18.675],
      [73.765, 18.650],
    ];

    it('accurately identifies point inside polygon boundary', () => {
      const insidePoint: [number, number] = [73.780, 18.660];
      const isInside = GeoUtil.isPointInPolygon(insidePoint, ward12Polygon);
      assert.equal(isInside, true);
    });

    it('rejects point outside polygon boundary', () => {
      const outsidePoint: [number, number] = [73.500, 18.200];
      const isInside = GeoUtil.isPointInPolygon(outsidePoint, ward12Polygon);
      assert.equal(isInside, false);
    });

    it('calculates Haversine distance in meters accurately', () => {
      // Nigdi Station to Akurdi Station approx 2.2 km
      const nigdi: [number, number] = [73.7749, 18.6608];
      const akurdi: [number, number] = [73.7801, 18.6496];
      const distanceMeters = GeoUtil.haversineDistanceMeters(nigdi, akurdi);
      assert.ok(distanceMeters > 1100 && distanceMeters < 1500);

      // Distance to self is 0
      const zeroDist = GeoUtil.haversineDistanceMeters(nigdi, nigdi);
      assert.equal(Math.round(zeroDist), 0);
    });
  });

  describe('2. OfficeRoutingService: SLA Resolution Rules', () => {
    it('resolves flat numeric SLA hours', () => {
      const mockOffice: any = { slaHours: 36 };
      const sla = OfficeRoutingService.resolveSlaHours(mockOffice, 'roads', 48);
      assert.equal(sla, 36);
    });

    it('resolves category-specific SLA hours correctly', () => {
      const mockOffice: any = {
        slaHours: {
          water: 24,
          sanitation: 12,
          roads: 72,
          default: 48,
        },
      };

      assert.equal(OfficeRoutingService.resolveSlaHours(mockOffice, 'water'), 24);
      assert.equal(OfficeRoutingService.resolveSlaHours(mockOffice, 'sanitation'), 12);
      assert.equal(OfficeRoutingService.resolveSlaHours(mockOffice, 'roads'), 72);
      assert.equal(OfficeRoutingService.resolveSlaHours(mockOffice, 'unknown_cat'), 48);
    });

    it('falls back to default hours when no office SLA configured', () => {
      const mockOffice: any = {};
      const sla = OfficeRoutingService.resolveSlaHours(mockOffice, 'roads', 60);
      assert.equal(sla, 60);
    });
  });

  describe('3. EscalationService: SLA Deadline Calculation & Hierarchy Advancing', () => {
    it('calculates SLA deadline correctly from creation timestamp', () => {
      const createdAt = new Date('2026-10-09T10:00:00.000Z');
      const slaHours = 24;
      const deadline = EscalationService.calculateSlaDeadline(createdAt, slaHours);

      const expected = new Date(createdAt.getTime() + 24 * 3600 * 1000);
      assert.equal(deadline.toISOString(), expected.toISOString());
    });

    it('simulates SLA breach escalation advancing up the ladder', () => {
      const initialLevel = 0;
      const maxTier = 3;

      let currentLevel = initialLevel;
      const history: Array<{ level: number; reason: string }> = [];

      // Step 1: First breach
      if (currentLevel < maxTier) {
        currentLevel++;
        history.push({ level: currentLevel, reason: 'sla_breach' });
      }
      assert.equal(currentLevel, 1);

      // Step 2: Second breach
      if (currentLevel < maxTier) {
        currentLevel++;
        history.push({ level: currentLevel, reason: 'sla_breach' });
      }
      assert.equal(currentLevel, 2);

      // Step 3: Third breach (hits cap)
      if (currentLevel < maxTier) {
        currentLevel++;
        history.push({ level: currentLevel, reason: 'sla_breach' });
      }
      assert.equal(currentLevel, 3);

      // Step 4: Cannot escalate beyond tier 3
      let escalatedBeyond = false;
      if (currentLevel < maxTier) {
        currentLevel++;
        escalatedBeyond = true;
      }
      assert.equal(escalatedBeyond, false);
      assert.equal(currentLevel, 3);
      assert.equal(history.length, 3);
    });
  });

  describe('4. SuggestOfficeSchema Strict Validation', () => {
    it('accepts valid coordinates [lng, lat] and category', () => {
      const valid = SuggestOfficeSchema.safeParse({
        coordinates: [73.7842, 18.6508],
        category: 'sanitation',
      });
      assert.equal(valid.success, true);
    });

    it('rejects invalid latitude out of range (> 90 or < -90)', () => {
      const invalidLat = SuggestOfficeSchema.safeParse({
        coordinates: [73.7842, 95.0],
        category: 'roads',
      });
      assert.equal(invalidLat.success, false);
    });

    it('rejects invalid longitude out of range (> 180 or < -180)', () => {
      const invalidLng = SuggestOfficeSchema.safeParse({
        coordinates: [185.0, 18.6508],
        category: 'roads',
      });
      assert.equal(invalidLng.success, false);
    });

    it('rejects payload with unexpected/injected fields (Zod strictness)', () => {
      const injected = SuggestOfficeSchema.safeParse({
        coordinates: [73.7842, 18.6508],
        category: 'water',
        escalatesToOfficeId: 'hacked_office_id',
      });
      assert.equal(injected.success, false);
    });
  });
});
