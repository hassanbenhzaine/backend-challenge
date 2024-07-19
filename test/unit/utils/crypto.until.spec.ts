import { calculateBufferHash } from '../../../src/utils/crypto.utils';

describe('calculateBufferHash', () => {
  it('calculates the correct hash for a given buffer', () => {
    const buffer = Buffer.from('Hello, world!', 'utf8');
    const expectedHash =
      '315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3';

    const actualHash = calculateBufferHash(buffer);

    expect(actualHash).toBe(expectedHash);
  });
});
