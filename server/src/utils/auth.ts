require('dotenv').config();
import { Secret, sign } from 'jsonwebtoken';
import { Response } from 'express';

import { User } from '../entities/User';

export const createToken = (type: 'accessToken' | 'refreshToken', user: User) =>
  sign(
    {
      userId: user.id,
    },
    type === 'accessToken' ? (process.env.ACCESS_TOKEN_SECRET as Secret) : (process.env.REFRESH_TOKEN_SECRET as Secret),
    {
      expiresIn: type === 'accessToken' ? '15m' : '30d',
    },
  );

export const sendRefreshToken = (res: Response, user: User) => {
  res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME as string, createToken('refreshToken', user), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/refresh_token',
  });
};
