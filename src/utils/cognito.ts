import { createRemoteJWKSet } from 'jose';

const issuer = process.env.COGNITO_ISSUER_URL;

if (!issuer) {
  throw new Error('COGNITO_ISSUER_URL is not set');
}

export const JWKS = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
);

