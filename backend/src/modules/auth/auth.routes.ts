import { Router } from 'express';
import multer from 'multer';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { verifyCsrfOrigin } from '../../middlewares/csrf.middleware.js';

const router = Router();
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for supporting credential docs
  },
});

// Email / Password Authentication
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Phone OTP Authentication (Passwordless)
router.post('/otp/request', AuthController.requestOtp);
router.post('/otp/verify', AuthController.verifyOtp);
router.post('/request-otp', AuthController.requestOtp);
router.post('/verify-otp', AuthController.verifyOtp);

// Sessions, Token Rotation & Logout (CSRF Protected Cookie Endpoints)
router.post('/refresh', verifyCsrfOrigin, AuthController.refreshToken);
router.post('/logout', verifyCsrfOrigin, AuthController.logout);
router.post('/logout-all', verifyCsrfOrigin, requireAuth, AuthController.logoutAll);

// Official & Agency Registration Claims (invite/approval based)
router.post('/claim-office', upload.single('document'), AuthController.claimOffice);
router.post('/invite/accept', AuthController.acceptInvite);

// 2FA (RFC 6238 TOTP & Single-Use Backup Codes)
router.post('/2fa/setup', requireAuth, AuthController.setup2Fa);
router.post('/2fa/verify-setup', requireAuth, AuthController.verify2FaSetup);
router.post('/2fa/verify-login', AuthController.verify2FaLogin);
router.post('/2fa/disable', requireAuth, AuthController.disable2Fa);

// User Profile & Account Lifecycle
router.get('/me', requireAuth, AuthController.getMe);
router.patch('/profile', requireAuth, AuthController.updateProfile);
router.post('/profile/phone', requireAuth, AuthController.addPhone);
router.post('/merge-accounts', requireAuth, AuthController.mergeAccounts);
router.post('/delete-account', requireAuth, AuthController.deleteAccount);
router.get('/export-data', requireAuth, AuthController.exportData);

// Password Recovery & Self-Service Change
router.post('/password/forgot', AuthController.forgotPassword);
router.post('/password/reset', AuthController.resetPassword);
router.post('/password/change', requireAuth, AuthController.changePassword);

export default router;
