export function stringToCharCodeArray<T extends ArrayBufferView>(
  value: string,
  Ctor: new (length: number) => T
): T {
  const decoded: any = new Ctor(value.length);
  for (let i = 0; i < value.length; i++) {
    decoded[i] = value.charCodeAt(i);
  }
  return decoded;
}

export function arrayToString(array: Uint8Array): string {
  return String.fromCharCode(...array);
}
