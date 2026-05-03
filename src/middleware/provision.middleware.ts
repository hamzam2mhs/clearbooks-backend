import type { Request, Response, NextFunction } from 'express';
import { provisionUser } from '../utils/provisionUser';

export async function ensureProvisioned(
    req: Request,
    res: Response,
    next: NextFunction
) {
  try {
    if (!req.user?.cognitoSub) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const user = await provisionUser({
      cognitoSub: req.user.cognitoSub,
      email: req.user.email,
    });

    if (!user.business) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'User has no business associated',
      });
    }

    // ✅ Attach minimal context only
    req.context = {
      userId: user.id,
      businessId: user.business.id,
    };

    next();
  } catch (err) {
    console.error('Provisioning failed:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to provision user',
    });
  }
}
