// _tests_/auth/signJwt.unit.test.js
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { signJwt } from '../../../src/auth/tokens/signJwt.js';

const originalEnv = { ...process.env };

beforeEach(() => {
  // Garantir segredo para todos os testes (independente do ambiente)
  process.env.JWT_SECRET = 'testsecret';
  // Zerar o TTL do .env por padrão; cada teste define se precisar
  delete process.env.JWT_EXPIRES_IN;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('signJwt (TTL + jti core)', () => {
  test('uses .env JWT_EXPIRES_IN when no param provided', () => {
    process.env.JWT_EXPIRES_IN = '45m';
    const token = signJwt({ id: 'u1', role: 'user' } /* no param */);
    const dec = jwt.verify(token, process.env.JWT_SECRET);
    const ttl = dec.exp - dec.iat; // ~2700s
    expect(ttl).toBeGreaterThanOrEqual(2699);
    expect(ttl).toBeLessThanOrEqual(2701);
  });

  test('string expiresIn overrides .env', () => {
    process.env.JWT_EXPIRES_IN = '1d';
    const token = signJwt({ id: 'u2', role: 'user' }, '15m');
    const dec = jwt.verify(token, process.env.JWT_SECRET);
    const ttl = dec.exp - dec.iat; // ~900s
    expect(ttl).toBeGreaterThanOrEqual(899);
    expect(ttl).toBeLessThanOrEqual(901);
  });

  test('numeric expiresIn (seconds) overrides .env', () => {
    process.env.JWT_EXPIRES_IN = '1d';
    const token = signJwt({ id: 'u3', role: 'user' }, 2);
    const dec = jwt.verify(token, process.env.JWT_SECRET);
    const ttl = dec.exp - dec.iat; // ~2s
    expect(ttl).toBeGreaterThanOrEqual(1);
    expect(ttl).toBeLessThanOrEqual(3);
  });

  test('emits unique jti per token', () => {
    const t1 = signJwt({ id: 'u4', role: 'user' }, '1h');
    const t2 = signJwt({ id: 'u4', role: 'user' }, '1h');
    const d1 = jwt.verify(t1, process.env.JWT_SECRET);
    const d2 = jwt.verify(t2, process.env.JWT_SECRET);
    expect(d1.jti).not.toBe(d2.jti);
  });

  test('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => signJwt({ id: 'u5', role: 'user' })).toThrow();
  });
});


/*Isolar ambiente: setar JWT_SECRET no beforeEach e resetar no afterEach.

Gerar token: chamar a função.

Verificar: usar jwt.verify (ou tua própria verifyJwt) pra inspecionar exp, iat, jti e payload.

Tolerância de tempo: sempre comparar com margenzinha (±1–2s).

Casos de erro: faltar JWT_SECRET, expiresIn inválido (se tu validar), token expirado.*/
