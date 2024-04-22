import { Injectable } from '@angular/core';

declare const BigInt;
declare type BigInt = number; // Not really, but ok (requires TypeScript 3.2).

@Injectable({
  providedIn: 'root'
})
export class Murmur2Service {
  // tslint:disable:no-bitwise
  private static readonly seed = 0x9747b28c;

  private static unsignedShiftRight(amount: number, value: BigInt): BigInt {
    const mask = BigInt((1 << (32 - amount)) - 1);
    return (value >> BigInt(amount)) & mask;
  }

  compute(value: string): number {
    const bytes = Array.from(value).map(ch => BigInt(ch.charCodeAt(0)));
    const length = bytes.length;
    const lengthDiv4 = Math.floor(length / 4);

    const seed = BigInt(Murmur2Service.seed);
    // 'm' and 'r' are mixing constants generated offline.
    // They're not really 'magic', they just happen to work well.
    const m = BigInt(0x5bd1e995), r = 24;

    // Initialize the hash to a random value
    let h = seed ^ BigInt(length);

    for (let i = 0; i < lengthDiv4; i++) {
      const i4 = i * 4;
      let k = BigInt(0);
      for (let j = 0; j < 4; j++) {
        k += (bytes[i4 + j] & BigInt(0xff)) << BigInt(j * 8);
      }
      k *= m;
      k ^= Murmur2Service.unsignedShiftRight(r, k);
      k *= m;
      h *= m;
      h ^= k;
    }

    // Handle the last few bytes of the input array
    for (let i = length % 4; i > 0; i--) {
      h ^= (bytes[(length & ~3) + (i - 1)] & BigInt(0xff)) << BigInt((i - 1) * 8);
      if (i === 1) {
        h *= m;
      }
    }

    h ^= Murmur2Service.unsignedShiftRight(13, h);
    h *= m;
    h ^= Murmur2Service.unsignedShiftRight(15, h);

    return Number(h & BigInt(0x7fffffff));
  }
}
