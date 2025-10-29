// src/auth/tokens/verifyJwt.js

// This script VALIDATES a JWT received from the client.
// It checks signature and expiration, and returns the clean payload + meta claims.
// Contract: verifyJwt(token) -> { payload, meta: { jti, iat, exp } }
// - token: raw JWT string (no "Bearer " prefix)
// - throws on invalid/expired tokens (TokenExpiredError, JsonWebTokenError)

import jwt from 'jsonwebtoken';

export function verifyJwt(token) {
  // Basic input validation
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Invalid JTW: token need to be a non empty string!');
  }

  // Read secret
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET absent in .env file');
  }

  // Keep strict and symmetric with sign
  const options = {
    ignoreExpiration: false, //native parameter. Reject inspired tokens
    // algorithms: ['HS256'], // uncomment if you explicitly sign with HS256
  };

  // Verify signature + expiration (will throw on failure)
  const decoded = jwt.verify(token, secret, options);

  // Extract meta claims (standard fields)
  const meta = {};
  if (decoded && decoded.jti) {
    meta.jti = decoded.jti;
  }
  if (decoded && decoded.iat) {
    meta.iat = decoded.iat;
  }
  if (decoded && decoded.exp) {
    meta.exp = decoded.exp;
  }

  // Build a clean payload (without std claims)
  const payload = { ...decoded };

  if (payload.iat !== undefined) {
    delete payload.iat;
  }
  if (payload.exp !== undefined) {
    delete payload.exp;
  }
  if (payload.jti !== undefined) {
    delete payload.jti;
  }

  return { payload, meta };
}


/*
  const payload = { ...decoded };

  if (payload.iat !== undefined) {
    delete payload.iat;
  }
  if (payload.exp !== undefined) {
    delete payload.exp;
  }
  if (payload.jti !== undefined) {
    delete payload.jti;
  }
*/
