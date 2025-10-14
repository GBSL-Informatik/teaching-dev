export const generateRandomBase64 = (byteLength = 32): string => {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  
  return btoa(
    Array.from(array)
      .map(byte => String.fromCharCode(byte))
      .join('')
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}