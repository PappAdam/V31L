export function stringToUint8Array(value: string): Uint8Array {
  const decoded = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    decoded[i] = value.charCodeAt(i);
  }

  return decoded;
}

export function arrayToString(array: Uint8Array): string {
  return String.fromCharCode(...array);
}
