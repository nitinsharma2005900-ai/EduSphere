import bcrypt from 'bcryptjs';
import { MemoryDataStore } from '../database/store';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { UserRole } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private db = MemoryDataStore.getInstance();

  public async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }) {
    const existing = this.db.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);
    const now = new Date().toISOString();

    const newUser = {
      id: `usr-${uuidv4().substring(0, 8)}`,
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.LEARNER,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.db.users.push(newUser);

    const tokens = generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    this.db.refreshTokens.push({
      id: uuidv4(),
      userId: newUser.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      isRevoked: false,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
      },
      tokens,
    };
  }

  public async login(data: { email: string; password: string }) {
    const user = this.db.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = bcrypt.compareSync(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    this.db.refreshTokens.push({
      id: uuidv4(),
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      isRevoked: false,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  public async refreshToken(oldRefreshToken: string) {
    const record = this.db.refreshTokens.find(r => r.token === oldRefreshToken);
    if (!record || record.isRevoked) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      record.isRevoked = true;
      throw new UnauthorizedError('Expired refresh token');
    }

    const user = this.db.users.find(u => u.id === payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Revoke previous refresh token (Token Rotation!)
    record.isRevoked = true;

    const newTokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    this.db.refreshTokens.push({
      id: uuidv4(),
      userId: user.id,
      token: newTokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      isRevoked: false,
    });

    return {
      tokens: newTokens,
    };
  }

  public async logout(refreshToken: string) {
    const record = this.db.refreshTokens.find(r => r.token === refreshToken);
    if (record) {
      record.isRevoked = true;
    }
    return { success: true };
  }

  public async getProfile(userId: string) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  }
}
