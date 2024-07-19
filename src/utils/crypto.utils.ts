import * as cryptolib from 'crypto';

export function calculateBufferHash(
  buffer: Buffer,
  algorithm: string = 'SHA256',
) {
  const hash = cryptolib.createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
}
