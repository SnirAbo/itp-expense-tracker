import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let prisma: any;
  let jwtService: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-access-token') };
    service = new AuthService(prisma, jwtService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-refresh-token');
  });

  describe('signup', () => {
    it('hashes the password, creates the user and issues access/refresh tokens', async () => {
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.signup('a@b.com', 'pw');

      expect(bcrypt.hash).toHaveBeenCalledWith('pw', 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', passwordHash: 'hashed-password' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1' }, expect.any(Object));
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual({ access: 'signed-access-token', refresh: 'signed-refresh-token' });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('a@b.com', 'pw')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('a@b.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns access/refresh tokens on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed-password' });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login('a@b.com', 'pw');

      expect(bcrypt.compare).toHaveBeenCalledWith('pw', 'hashed-password');
      expect(result).toEqual({ access: 'signed-access-token', refresh: 'signed-refresh-token' });
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when no token is provided', async () => {
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the token fails verification', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('bad token');
      });

      await expect(service.refresh('old-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('revokes the token family when the old token is unknown or already revoked', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('old-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rotates the refresh token and issues new tokens when valid', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      prisma.refreshToken.findUnique.mockResolvedValue({ userId: 'user-1', revokedAt: null });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('old-token');

      expect(prisma.refreshToken.update).toHaveBeenCalled();
      expect(result).toEqual({ access: 'signed-access-token', refresh: 'signed-refresh-token' });
    });
  });

  describe('forgot', () => {
    it('does nothing when the user does not exist (no leak)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.forgot('missing@b.com');

      expect(prisma.passwordResetToken.upsert).not.toHaveBeenCalled();
    });

    it('creates/updates a reset token when the user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });
      prisma.passwordResetToken.upsert.mockResolvedValue({});

      await service.forgot('a@b.com');

      expect(prisma.passwordResetToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  describe('reset', () => {
    it('throws UnauthorizedException when the token fails verification', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('bad token');
      });

      await expect(service.reset('bad-token', 'newpw')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the stored token does not match, is used, or is expired', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.reset('token', 'newpw')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates the password and marks the reset token as used on success', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
      const crypto = require('crypto');
      const expectedHash = crypto.createHash('sha256').update('valid-token').digest('hex');
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        tokenHash: expectedHash,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.update.mockResolvedValue({});
      prisma.passwordResetToken.update.mockResolvedValue({});

      await service.reset('valid-token', 'newpw');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpw', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed-password' },
      });
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });
});
