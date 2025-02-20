import { trimSlashes } from './trimSlashes';

/**
 *
 * @param parts
 * @returns path without leading or trailing slashes
 * @example
 * resolvePath('a', 'b', 'c') // 'a/b/c'
 * resolvePath('a', '/b', 'c') // 'a/b/c'
 * resolvePath('a/b/c', '../d', 'a') // 'a/b/d/a'
 */
export const resolvePath = (...parts: string[]) => {
    if (parts.length < 2) {
        return parts[0];
    }
    return trimSlashes(
        parts.slice(1).reduce((base, part) => {
            return new URL(part, `path:/${base}/`).pathname.slice(1); // the slice(1) is to remove the leading slash
        }, parts[0])
    );
};
