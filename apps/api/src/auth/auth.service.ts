import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private signAccess(userId: string) {
    return this.jwt.sign({ sub: userId }, { secret: process.env.JWT_ACCESS_SECRET || 'access' });
  }
  private async hashRefresh(jti: string, userId: string, exp: Date) {
    const token = jwt.sign({ sub: userId, jti }, process.env.JWT_REFRESH_SECRET || 'refresh', {
      expiresIn: process.env.REFRESH_TOKEN_TTL || '30d',
    });
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.refreshToken.create({ data: { jti, userId, tokenHash, expiresAt: exp } });
    return token;
  }

  private async rotateRefresh(oldToken?: string | null) {
    if (oldToken) {
      const oldHash = createHash('sha256').update(oldToken).digest('hex');
      const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash: oldHash } });
      if (!existing || existing.revokedAt) {
        // Reuse or unknown => revoke family
        await this.prisma.refreshToken.updateMany({ where: { userId: existing?.userId }, data: { revokedAt: new Date() } });
        throw new UnauthorizedException('Invalid refresh');
      }
      await this.prisma.refreshToken.update({ where: { tokenHash: oldHash }, data: { revokedAt: new Date() } });
    }
  }

  async signup(email: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({ data: { email, passwordHash: hash } });
    const access = this.signAccess(user.id);
    const jti = randomUUID();
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const refresh = await this.hashRefresh(jti, user.id, exp);
    return { access, refresh };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const access = this.signAccess(user.id);
    const jti = randomUUID();
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const refresh = await this.hashRefresh(jti, user.id, exp);
    return { access, refresh };
  }

  async refresh(oldToken?: string) {
    if (!oldToken) throw new UnauthorizedException('Missing token');
    let payload: any;
    try {
      payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET || 'refresh');
    } catch {
      throw new UnauthorizedException('Invalid refresh');
    }
    await this.rotateRefresh(oldToken);
    const access = this.signAccess(payload.sub);
    const jti = randomUUID();
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const refresh = await this.hashRefresh(jti, payload.sub, exp);
    return { access, refresh };
  }

  async logout(oldToken: string) {
    await this.rotateRefresh(oldToken);
  }

  // Password reset: store token with single-use
  async forgot(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // don't leak
    const jti = randomUUID();
    const token = jwt.sign({ sub: user.id, jti, kind: 'reset' }, process.env.JWT_REFRESH_SECRET || 'refresh', {
      expiresIn: '30m',
    });
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000), usedAt: null },
      create: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });
    console.log(`[DEV] Reset link: http://localhost:5173/reset?token=${token}`);
  }

  async reset(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh');
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rec = await this.prisma.passwordResetToken.findUnique({ where: { userId: payload.sub } });
    if (!rec || rec.tokenHash !== tokenHash || rec.usedAt || rec.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid token');
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: payload.sub }, data: { passwordHash: hash } });
    await this.prisma.passwordResetToken.update({ where: { userId: payload.sub }, data: { usedAt: new Date() } });
  }
}
