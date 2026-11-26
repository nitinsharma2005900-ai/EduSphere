import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '@edusphere/shared';
import { randomUUID } from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: '7d',
    jwtid: randomUUID(),
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 900 seconds
  };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};
