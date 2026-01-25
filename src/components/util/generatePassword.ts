export const ALPHABET_BIG = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' as const;
export const ALPHABET_SMALL = 'abcdefghijklmnopqrstuvwxyz' as const;
export const ALPHABET = `${ALPHABET_BIG}${ALPHABET_SMALL}` as const;
export const NUMBERS = '0123456789' as const;
export const ALPHANUMERIC = `${ALPHABET}${NUMBERS}` as const;
export const SPECIAL_CHARACTERS = '!@#$%^&*()_-+=' as const;
export const DEFAULT_CHARSET = `${ALPHANUMERIC}${SPECIAL_CHARACTERS}` as const;

const generatePassword = (length = 16, charset: string = DEFAULT_CHARSET) => {
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (x) => charset[x % charset.length]).join('');
};

export default generatePassword;
