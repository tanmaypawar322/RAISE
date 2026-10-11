import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { config } from '../../config/env.js';
import { Issue } from '../../models/Issue.js';
import { Office } from '../../models/Office.js';

describe('Phase 1 Access Gate: API Gating & Shared Issue Protection', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalRequireLogin = config.appRequireLogin;
  const originalPublicIssuePages = config.publicIssuePages;
  const originalIssueFind = Issue.find;
  const originalIssueFindById = Issue.findById;
  const originalOfficeFind = Office.find;

  before(async () => {
    // Stub Mongoose models to return cleanly when database is not connected
    const createChainableQuery = (resolveVal: any) => {
      const q: any = {
        then: (onResolve: any, onReject: any) => Promise.resolve(resolveVal).then(onResolve, onReject),
        catch: (onReject: any) => Promise.resolve(resolveVal).catch(onReject),
        sort: () => q,
        limit: () => q,
        skip: () => q,
        select: () => q,
        populate: () => q,
      };
      return q;
    };

    Issue.find = (() => createChainableQuery([])) as any;
    Issue.findById = (() => createChainableQuery(null)) as any;
    Issue.countDocuments = (() => Promise.resolve(0)) as any;
    Issue.estimatedDocumentCount = (() => Promise.resolve(0)) as any;
    Office.find = (() => createChainableQuery([])) as any;
    Office.findById = (() => createChainableQuery(null)) as any;
    Office.countDocuments = (() => Promise.resolve(0)) as any;

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    config.appRequireLogin = originalRequireLogin;
    config.publicIssuePages = originalPublicIssuePages;
    Issue.find = originalIssueFind;
    Issue.findById = originalIssueFindById;
    Office.find = originalOfficeFind;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('When APP_REQUIRE_LOGIN=true, unauthenticated request to /api/issues returns 401', async () => {
    config.appRequireLogin = true;
    config.publicIssuePages = false;

    const res = await fetch(`${baseUrl}/api/issues`);
    assert.strictEqual(res.status, 401, 'Feed endpoint must return 401 when unauthenticated');
    const data = (await res.json()) as any;
    assert.strictEqual(data.success, false);
    assert.match(data.message, /Authentication required/i);
  });

  it('When APP_REQUIRE_LOGIN=true, unauthenticated request to /api/issues/similar returns 401', async () => {
    config.appRequireLogin = true;
    config.publicIssuePages = false;

    const res = await fetch(`${baseUrl}/api/issues/similar?q=water`);
    assert.strictEqual(res.status, 401, 'Search/similar endpoint must return 401 when unauthenticated');
  });

  it('When APP_REQUIRE_LOGIN=true, unauthenticated request to /api/issues/map-bounds returns 401', async () => {
    config.appRequireLogin = true;
    config.publicIssuePages = false;

    const res = await fetch(`${baseUrl}/api/issues/map-bounds`);
    assert.strictEqual(res.status, 401, 'Map bounds endpoint must return 401 when unauthenticated');
  });

  it('When APP_REQUIRE_LOGIN=true and PUBLIC_ISSUE_PAGES=false, issue detail returns 401 without cookie', async () => {
    config.appRequireLogin = true;
    config.publicIssuePages = false;

    const res = await fetch(`${baseUrl}/api/issues/65f000000000000000000001`);
    assert.strictEqual(res.status, 401, 'Issue detail must return 401 when publicIssuePages is false');
  });

  it('When APP_REQUIRE_LOGIN=true, unauthenticated request to /api/offices returns 401', async () => {
    config.appRequireLogin = true;

    const res = await fetch(`${baseUrl}/api/offices`);
    assert.strictEqual(res.status, 401, 'Offices directory must return 401 when unauthenticated');
  });

  it('When APP_REQUIRE_LOGIN=true, unauthenticated request to /api/offices/:id returns 401', async () => {
    config.appRequireLogin = true;

    const res = await fetch(`${baseUrl}/api/offices/65f000000000000000000001`);
    assert.strictEqual(res.status, 401, 'Office detail must return 401 when unauthenticated');
  });

  it('When PUBLIC_ISSUE_PAGES=true and APP_REQUIRE_LOGIN=true, issue detail allows unauthenticated access while feed remains 401', async () => {
    config.appRequireLogin = true;
    config.publicIssuePages = true;

    // Issue detail is allowed through gate (will return 404 or data, but NOT 401)
    const detailRes = await fetch(`${baseUrl}/api/issues/65f000000000000000000001`);
    assert.notStrictEqual(detailRes.status, 401, 'Issue detail must not return 401 when PUBLIC_ISSUE_PAGES=true');

    // Feed still strictly returns 401
    const feedRes = await fetch(`${baseUrl}/api/issues`);
    assert.strictEqual(feedRes.status, 401, 'Feed must remain gated even when PUBLIC_ISSUE_PAGES=true');
  });

  it('When APP_REQUIRE_LOGIN=false, public feed and offices do not return 401', async () => {
    config.appRequireLogin = false;
    config.publicIssuePages = false;

    const feedRes = await fetch(`${baseUrl}/api/issues`);
    assert.notStrictEqual(feedRes.status, 401, 'Feed must not return 401 when APP_REQUIRE_LOGIN=false');

    const officesRes = await fetch(`${baseUrl}/api/offices`);
    assert.notStrictEqual(officesRes.status, 401, 'Offices must not return 401 when APP_REQUIRE_LOGIN=false');
  });

  it('When authenticated with Bearer token or cookie, request passes the gate', async () => {
    config.appRequireLogin = true;
    config.publicIssuePages = false;

    const validToken = jwt.sign(
      {
        userId: '65f000000000000000000099',
        role: 'citizen',
        displayName: 'Test Citizen',
      },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    // 1. Bearer Header
    const bearerRes = await fetch(`${baseUrl}/api/issues`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });
    assert.notStrictEqual(bearerRes.status, 401, 'Bearer token must pass gate');

    // 2. Cookie raise_token
    const cookieRes = await fetch(`${baseUrl}/api/issues`, {
      headers: {
        Cookie: `raise_token=${validToken}`,
      },
    });
    assert.notStrictEqual(cookieRes.status, 401, 'Cookie raise_token must pass gate');
  });
});
