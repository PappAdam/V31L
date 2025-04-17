export function stringToCharCodeArray(str: string) {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 0xff; // Force 8-bit truncation
  }
  return arr;
}

export function arrayToString(arr: Uint8Array): string {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}
