import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                cognitoSub: string;
                email?: string;
                emailVerified?: boolean;
            };

            context?: {
                userId: string;
                businessId: string;
            };
        }
    }
}

export {};