import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RegisterSchema, LoginSchema } from './auth.controller.js';
import { createAdmin } from '../../scripts/create-admin.js';

describe('Phase 1 Security Rules: Privilege Escalation & Unknown Field Rejection', () => {
  it('RegisterSchema must reject role field from client (cannot elevate privilege)', () => {
    const payload = {
      name: 'Malicious User',
      email: 'attacker@example.com',
      password: 'StrongPassword123',
      role: 'admin', // Should be rejected by .strict()
    };

    const result = RegisterSchema.safeParse(payload);
    assert.strictEqual(result.success, false, 'Payload containing role field should fail validation');
    if (!result.success) {
      const fieldErrors = result.error.errors.map((e) => e.path.join('.'));
      assert.ok(
        result.error.errors.some((e) => e.code === 'unrecognized_keys'),
        'Zod should report unrecognized_keys error'
      );
    }
  });

  it('RegisterSchema must reject officeId, status, and any unknown fields', () => {
    const payload = {
      name: 'Contractor',
      email: 'contractor@example.com',
      password: 'StrongPassword123',
      officeId: '65f000000000000000000001',
      status: 'active',
      isOfficialVerified: true,
    };

    const result = RegisterSchema.safeParse(payload);
    assert.strictEqual(result.success, false, 'Payload with privilege fields must fail validation');
  });

  it('RegisterSchema accepts valid citizen registration with allowed fields', () => {
    const validCitizen = {
      name: 'Aditya Pawar',
      email: 'aditya@example.com',
      password: 'ValidPassword123',
      language: 'en',
    };

    const result = RegisterSchema.safeParse(validCitizen);
    assert.strictEqual(result.success, true, 'Valid citizen payload should pass validation');
  });

  it('LoginSchema must be strict and reject extra privilege parameters', () => {
    const maliciousLogin = {
      email: 'admin@raise.org',
      password: 'SecretPassword',
      role: 'admin',
      bypass: true,
    };

    const result = LoginSchema.safeParse(maliciousLogin);
    assert.strictEqual(result.success, false, 'Login payload with extra fields must fail validation');
  });

  it('createAdmin CLI function must reject passwords with fewer than 12 characters', async () => {
    await assert.rejects(
      async () => {
        await createAdmin('testadmin@raise.org', 'ShortPass1');
      },
      /Password must be at least 12 characters/,
      'createAdmin should reject password shorter than 12 characters'
    );
  });
});
