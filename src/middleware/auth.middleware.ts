
import { jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { JWKS } from '../utils/cognito';

const issuer = process.env.COGNITO_ISSUER_URL;
const clientId = process.env.COGNITO_CLIENT_ID;

if (!issuer || !clientId) {
  throw new Error('Cognito env vars are missing');
}

// Augment Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: {
        cognitoSub: string;
        email?: string;
        emailVerified?: boolean;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing Authorization header',
      });
    }

    const token = authHeader.slice('Bearer '.length);

    // Verify JWT signature + issuer (NO audience check)
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
    });

    // Ensure this is an ACCESS token
    if (payload.token_use !== 'access') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid token type',
      });
    }

console.log('TOKEN client_id:', payload.client_id);
console.log('ENV   client_id:', clientId);

    // Validate Cognito client
    if (payload.client_id !== clientId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid token client',
      });
    }

    // Attach normalized user info
    req.user = {
      cognitoSub: payload.sub as string,
      email: payload.email as string | undefined,
      emailVerified: payload.email_verified as boolean | undefined,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
}
