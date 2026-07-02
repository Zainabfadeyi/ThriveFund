import type { Request, Response, NextFunction } from 'express';
import { ok, created, noContent } from '../../lib/response';
import { authService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from './auth.schema';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const body = registerSchema.parse(req.body);
      const data = await authService.register(body);
      created(res, data);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(req.body);
      const data = await authService.login(body);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const body = refreshSchema.parse(req.body);
      const data = await authService.refresh(body);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      if (refresh_token) await authService.logout(refresh_token);
      noContent(res);
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(body);
      ok(res, { message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(body);
      ok(res, { message: 'Password updated successfully.' });
    } catch (err) { next(err); }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const body = verifyEmailSchema.parse(req.body);
      const data = await authService.verifyEmail(body);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const body = resendVerificationSchema.parse(req.body);
      await authService.resendVerification(body);
      ok(res, { message: 'If that email is registered and unverified, a verification link has been sent.' });
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.me(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },
};
