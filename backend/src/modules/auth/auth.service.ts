import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env } from '../../config/env';
import { Errors } from '../../lib/errors';
import { sendEmail, passwordResetEmail, emailVerificationEmail } from '../../lib/email';
import { authRepository } from './auth.repository';
import { organizationsRepository } from '../organizations/organizations.repository';
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from './auth.schema';

function signTokens(userId: string, role: string, email: string) {
  const access_token = jwt.sign({ sub: userId, role, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  const refresh_token = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { access_token, refresh_token, expires_in: 3600 };
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

async function uniqueOrganizationSlug(name: string) {
  const baseSlug = slugify(name) || `org-${Date.now()}`;
  let slug = baseSlug;
  let attempt = 0;
  while (await organizationsRepository.findBySlug(slug)) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
  return slug;
}

export const authService = {
  async register(body: RegisterInput) {
    const existing = await authRepository.findUserByEmail(body.email);
    if (existing) throw Errors.conflict('Email already registered');

    const password_hash = await bcrypt.hash(body.password, 12);
    const id = `usr_${uuid().replace(/-/g, '').slice(0, 12)}`;

    const organizationId = `org_${uuid().replace(/-/g, '').slice(0, 12)}`;
    const { user, organization } = await authRepository.insertUserWithOrganization({
      user: {
        id,
        full_name: body.full_name,
        email: body.email,
        password_hash,
        phone_number: body.phone_number,
      },
      organization: {
        id: organizationId,
        name: body.organization_name,
        slug: await uniqueOrganizationSlug(body.organization_name),
        type: body.organization_type,
        description: body.organization_description,
        email: body.organization_email,
        phone: body.organization_phone,
        address: body.organization_address,
      },
      membership: { id: `om_${uuid().replace(/-/g, '').slice(0, 12)}` },
    });

    const tokens = signTokens(user.id, user.role, user.email);
    await authRepository.insertRefreshToken(tokens.refresh_token, user.id);
    await this.sendVerificationEmail(user.id, user.email, user.full_name, organization.name).catch(() => undefined);

    return { user, organization, tokens };
  },

  async sendVerificationEmail(userId: string, email: string, name: string, organizationName = 'your organization') {
    const token = uuid().replace(/-/g, '');
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await authRepository.insertEmailVerification({ token, user_id: userId, expires_at });
    const link = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
    const { subject, html } = emailVerificationEmail(name, link, organizationName);
    await sendEmail({ to: { email, name }, subject, html });
  },

  async verifyEmail(body: VerifyEmailInput) {
    const verification = await authRepository.findEmailVerification(body.token);
    if (!verification) throw Errors.validation('Invalid or expired verification token');

    await authRepository.markEmailVerified(verification.user_id as string);
    await authRepository.markEmailVerificationUsed(body.token);
    return { verified: true };
  },

  async resendVerification(body: ResendVerificationInput) {
    const user = await authRepository.findUserByEmail(body.email);
    if (!user) return;
    if (user.email_verified_at) return;
    await this.sendVerificationEmail(
      user.id as string,
      user.email as string,
      user.full_name as string,
    ).catch(() => undefined);
  },

  async login(body: LoginInput) {
    const user = await authRepository.findUserByEmail(body.email);
    if (!user) throw Errors.unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) throw Errors.unauthorized('Invalid email or password');

    const tokens = signTokens(user.id, user.role, user.email);
    await authRepository.insertRefreshToken(tokens.refresh_token, user.id);

    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  },

  async refresh(body: RefreshInput) {
    let payload: { sub: string };
    try {
      payload = jwt.verify(body.refresh_token, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw Errors.unauthorized('Invalid refresh token');
    }

    const storedToken = await authRepository.findRefreshToken(body.refresh_token);
    if (!storedToken) throw Errors.unauthorized('Refresh token revoked or expired');

    const user = await authRepository.findUserById(payload.sub);
    if (!user) throw Errors.unauthorized('User not found');

    const access_token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
    );
    return { access_token, expires_in: 3600 };
  },

  async logout(refreshToken: string) {
    await authRepository.deleteRefreshToken(refreshToken);
  },

  async forgotPassword(body: ForgotPasswordInput) {
    const user = await authRepository.findUserByEmail(body.email);
    if (!user) return; // silent — no email enumeration

    const token = uuid().replace(/-/g, '');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await authRepository.insertPasswordReset({ token, user_id: user.id, expires_at });

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(user.full_name as string, resetLink);
    await sendEmail({ to: { email: user.email, name: user.full_name as string }, subject, html });
  },

  async resetPassword(body: ResetPasswordInput) {
    const reset = await authRepository.findPasswordReset(body.token);
    if (!reset) throw Errors.validation('Invalid or expired reset token');

    const password_hash = await bcrypt.hash(body.password, 12);
    await authRepository.updatePasswordHash(reset.user_id, password_hash);
    await authRepository.markPasswordResetUsed(body.token);
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw Errors.notFound('User');
    return user;
  },
};
