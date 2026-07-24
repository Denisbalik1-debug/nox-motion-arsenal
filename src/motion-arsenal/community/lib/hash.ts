export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Synchronous SHA-256 is used while catalogs are constructed during render.
// It is intentionally self-contained so the client does not need Node crypto.
export function sha256Sync(input: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const ascii = unescape(encodeURIComponent(input));
  const bitLength = ascii.length * 8;
  const hash: number[] = [];
  const constants: number[] = [];
  const composite: Record<number, boolean> = {};
  let primeCounter = 0;

  for (let candidate = 2; primeCounter < 64; candidate += 1) {
    if (composite[candidate]) continue;
    for (let multiple = candidate * candidate; multiple < 313; multiple += candidate) composite[multiple] = true;
    hash[primeCounter] = (candidate ** 0.5 * maxWord) | 0;
    constants[primeCounter] = (candidate ** (1 / 3) * maxWord) | 0;
    primeCounter += 1;
  }

  let padded = `${ascii}\x80`;
  while ((padded.length % 64) !== 56) padded += '\x00';
  for (let index = 0; index < padded.length; index += 1) {
    words[index >> 2] = (words[index >> 2] ?? 0) | (padded.charCodeAt(index) << ((3 - index) % 4) * 8);
  }
  words.push(Math.floor(bitLength / maxWord), bitLength);

  for (let block = 0; block < words.length; block += 16) {
    const schedule = words.slice(block, block + 16);
    const oldHash = hash.slice(0, 8);
    const working = hash.slice(0, 8);
    for (let index = 0; index < 64; index += 1) {
      const w15 = schedule[index - 15];
      const w2 = schedule[index - 2];
      const a = working[0];
      const e = working[4];
      const sigma0 = index < 16 ? 0 : rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const sigma1 = index < 16 ? 0 : rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      schedule[index] = index < 16
        ? schedule[index]
        : (((schedule[index - 16] + sigma0) | 0) + ((schedule[index - 7] + sigma1) | 0)) | 0;
      const temp1 = (((working[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))) | 0)
        + (((e & working[5]) ^ (~e & working[6])) + constants[index] + schedule[index])) | 0;
      const temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & working[1]) ^ (a & working[2]) ^ (working[1] & working[2]))) | 0;
      working.pop();
      working.unshift((temp1 + temp2) | 0);
      working[4] = (working[4] + temp1) | 0;
    }
    for (let index = 0; index < 8; index += 1) hash[index] = (working[index] + oldHash[index]) | 0;
  }

  return hash.slice(0, 8).map((value) => (value >>> 0).toString(16).padStart(8, '0')).join('');
}
