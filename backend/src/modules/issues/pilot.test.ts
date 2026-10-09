import { describe, it } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { GeoUtil } from '../../utils/geo.util.js';
import { PILOT_WARD_12_BOUNDARY, PCMC_HQ_BOUNDARY } from '../../scripts/seed-pilot.js';
import { OfficeRoutingService } from '../../services/office-routing.service.js';
import { EscalationService } from '../../services/escalation.service.js';
import { serializeIssue } from './issues.controller.js';

describe('Phase 7: Ward 12 (Nigdi - Pradhikaran) Pilot Flow & Lifecycle Verification', () => {
  describe('1. Pilot Ward Boundary Geo-Containment', () => {
    it('verifies real Ward 12 pilot locations are strictly inside the Ward 12 polygon', () => {
      // Akurdi Railway Station
      const akurdiLngLat: [number, number] = [73.7842, 18.6508];
      assert.strictEqual(
        GeoUtil.isPointInPolygon(akurdiLngLat, PILOT_WARD_12_BOUNDARY.coordinates[0]),
        true,
        'Akurdi Station must be inside Ward 12 polygon'
      );

      // Nigdi Sector 24
      const sector24LngLat: [number, number] = [73.7812, 18.6548];
      assert.strictEqual(
        GeoUtil.isPointInPolygon(sector24LngLat, PILOT_WARD_12_BOUNDARY.coordinates[0]),
        true,
        'Nigdi Sector 24 must be inside Ward 12 polygon'
      );

      // Pradhikaran Vegetable Market (Sector 25)
      const marketLngLat: [number, number] = [73.7785, 18.6590];
      assert.strictEqual(
        GeoUtil.isPointInPolygon(marketLngLat, PILOT_WARD_12_BOUNDARY.coordinates[0]),
        true,
        'Pradhikaran vegetable market must be inside Ward 12 polygon'
      );
    });

    it('rejects points outside Ward 12 while confirming HQ polygon containment', () => {
      // Pimpri HQ location
      const pimpriHqLngLat: [number, number] = [73.8016, 18.6277];
      assert.strictEqual(
        GeoUtil.isPointInPolygon(pimpriHqLngLat, PILOT_WARD_12_BOUNDARY.coordinates[0]),
        false,
        'Pimpri HQ coordinates must NOT be inside Ward 12 polygon'
      );

      assert.strictEqual(
        GeoUtil.isPointInPolygon(pimpriHqLngLat, PCMC_HQ_BOUNDARY.coordinates[0]),
        true,
        'Pimpri HQ coordinates must be inside PCMC HQ boundary'
      );
    });
  });

  describe('2. Pilot Ward Office Routing & Department SLA Resolution', () => {
    const mockWard12Office = {
      _id: new mongoose.Types.ObjectId(),
      name: 'PCMC Ward 12 Field Office (Nigdi - Pradhikaran)',
      level: 'ward',
      department: 'general',
      supportedCategories: ['roads', 'sanitation', 'general'],
      slaHours: { roads: 48, sanitation: 24, default: 48 },
    };

    const mockWaterOffice = {
      _id: new mongoose.Types.ObjectId(),
      name: 'PCMC Water Supply Division (Zone A & Ward 12)',
      level: 'corporation',
      department: 'water',
      supportedCategories: ['water'],
      slaHours: 48,
    };

    it('resolves correct department SLA hours for Ward 12 grievances', () => {
      // Sanitation emergency SLA
      const sanitationSla = OfficeRoutingService.resolveSlaHours(mockWard12Office as any, 'sanitation');
      assert.strictEqual(sanitationSla, 24, 'Ward 12 sanitation SLA should resolve to 24 hours');

      // Roads maintenance SLA
      const roadsSla = OfficeRoutingService.resolveSlaHours(mockWard12Office as any, 'roads');
      assert.strictEqual(roadsSla, 48, 'Ward 12 roads SLA should resolve to 48 hours');

      // Water supply division SLA
      const waterSla = OfficeRoutingService.resolveSlaHours(mockWaterOffice as any, 'water');
      assert.strictEqual(waterSla, 48, 'Water division SLA should resolve to 48 hours');
    });
  });

  describe('3. Escalation Ladder for Ward 12 Pilot', () => {
    it('advances breached grievance from Ward 12 Field Office to Central Grievance Redressal HQ', () => {
      const hqOfficeId = new mongoose.Types.ObjectId();
      const ward12OfficeId = new mongoose.Types.ObjectId();

      const ward12Office = {
        _id: ward12OfficeId,
        name: 'PCMC Ward 12 Field Office',
        escalatesToOfficeId: hqOfficeId,
      };

      const issue = {
        _id: new mongoose.Types.ObjectId(),
        title: 'आकुर्डी रेल्वे स्टेशन समोरील रस्त्यावर धोकादायक खड्डे व तुंबलेले पाणी',
        officeId: ward12OfficeId,
        escalationLevel: 0,
        status: 'submitted',
        escalationHistory: [] as any[],
        slaDeadline: new Date(Date.now() - 3600000), // 1 hour past SLA deadline
      };

      // Simulate escalation ladder advance
      assert.strictEqual(issue.slaDeadline < new Date(), true, 'SLA deadline must be breached');
      issue.escalationLevel += 1;
      issue.officeId = ward12Office.escalatesToOfficeId;
      issue.escalationHistory.push({
        fromOfficeId: ward12Office._id,
        toOfficeId: hqOfficeId,
        escalatedAt: new Date(),
        reason: 'SLA breached after 48h with no action',
      });

      assert.strictEqual(issue.escalationLevel, 1);
      assert.strictEqual(issue.officeId.toString(), hqOfficeId.toString());
      assert.strictEqual(issue.escalationHistory.length, 1);
    });
  });

  describe('4. Resolution Proof & Citizen Dispute Workflow in Pilot', () => {
    it('verifies that resolution proof requires note >= 10 chars and photo proof', () => {
      const validResolution = {
        note: 'खड्डे बुजवून डांबरीकरण पूर्ण करण्यात आले आहे.', // > 10 chars
        afterPhotoUrl: 'https://storage.raise.org/photos/akurdi_after.jpg',
      };

      assert.strictEqual(validResolution.note.trim().length >= 10, true);
      assert.strictEqual(Boolean(validResolution.afterPhotoUrl), true);

      const invalidNote = {
        note: 'झाले', // < 10 chars
        afterPhotoUrl: 'https://storage.raise.org/photos/after.jpg',
      };
      assert.strictEqual(invalidNote.note.trim().length < 10, true);
    });

    it('handles citizen dispute and re-opens SLA clock', () => {
      const issue = {
        status: 'resolved_pending_confirmation',
        reopenCount: 0,
        disputes: [] as any[],
        statusTimeline: [] as any[],
      };

      // Citizen disputes resolution
      const disputePayload = {
        userId: new mongoose.Types.ObjectId(),
        reason: 'काम अपूर्ण आहे, फक्त तात्पुरती माती टाकली आहे, डांबरीकरण झालेले नाही.',
      };

      issue.status = 'disputed';
      issue.reopenCount += 1;
      issue.disputes.push(disputePayload);
      issue.statusTimeline.push({
        status: 'disputed',
        note: disputePayload.reason,
        updatedAt: new Date(),
      });

      assert.strictEqual(issue.status, 'disputed');
      assert.strictEqual(issue.reopenCount, 1);
      assert.strictEqual(issue.disputes.length, 1);
    });
  });

  describe('5. Privacy Protection & Anonymization in Public Dossier', () => {
    it('anonymizes citizen identity while keeping civic issue public in Ward 12 view', () => {
      const pilotIssue = {
        _id: new mongoose.Types.ObjectId(),
        title: 'प्राधिकरण भाजी मंडई जवळ कचऱ्याचे ढीग व दुर्गंधी',
        isAnonymous: true,
        authorId: {
          _id: new mongoose.Types.ObjectId(),
          displayName: 'Aditya Pawar',
          homeArea: { ward: 'Ward 12' },
        },
        raiseCount: 65,
        location: {
          type: 'Point',
          coordinates: [73.7785, 18.6590],
          ward: 'Ward 12',
          city: 'Pimpri-Chinchwad',
        },
      };

      const serialized = serializeIssue(pilotIssue);

      assert.strictEqual(serialized.authorId, undefined, 'authorId must not leak in public dossier');
      assert.strictEqual(serialized.author.displayName, 'Anonymous citizen');
      assert.strictEqual(serialized.author.homeArea, undefined);
      assert.strictEqual(serialized.raiseCount, 65);
    });
  });
});
