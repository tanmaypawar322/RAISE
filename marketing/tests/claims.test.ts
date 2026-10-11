import { describe, it } from 'node:test';
import assert from 'node:assert';
import { claims } from '../content/claims';
import { appUrl } from '../src/lib/app-url';

describe('1. Marketing Claims Policy Verification', () => {
  it('all registered claims must be unverified by default', () => {
    const claimList = Object.values(claims);
    assert.ok(claimList.length >= 7, 'Expected at least 7 claims registered');
    
    // Non-negotiable rule: all claims start unverified (verified: false)
    for (const c of claimList) {
      assert.strictEqual(
        c.verified,
        false,
        `Claim "${c.id}" must remain verified: false until explicitly confirmed by project lead.`
      );
    }
  });

  it('every claim has valid non-empty text in en, mr, and hi', () => {
    for (const c of Object.values(claims)) {
      assert.ok(c.text.en && c.text.en.trim().length > 0, `Claim ${c.id} missing en text`);
      assert.ok(c.text.mr && c.text.mr.trim().length > 0, `Claim ${c.id} missing mr text`);
      assert.ok(c.text.hi && c.text.hi.trim().length > 0, `Claim ${c.id} missing hi text`);
      assert.ok(c.notes && c.notes.length > 0, `Claim ${c.id} missing verification notes`);
    }
  });
});

describe('2. App URL Linker Verification', () => {
  it('correctly formats app authentication targets with language query parameter', () => {
    const signInEn = appUrl('/sign-in', 'en');
    assert.strictEqual(signInEn, 'http://localhost:3000/sign-in?lang=en');

    const signUpMr = appUrl('/sign-up', 'mr');
    assert.strictEqual(signUpMr, 'http://localhost:3000/sign-up?lang=mr');

    const officeClaimHi = appUrl('/office/request-access', 'hi');
    assert.strictEqual(officeClaimHi, 'http://localhost:3000/office/request-access?lang=hi');
  });

  it('handles existing query parameters when appending language', () => {
    const nextUrl = appUrl('/sign-in?next=/dashboard', 'mr');
    assert.strictEqual(nextUrl, 'http://localhost:3000/sign-in?next=/dashboard&lang=mr');
  });
});
