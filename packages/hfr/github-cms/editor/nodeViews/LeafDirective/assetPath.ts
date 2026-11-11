/**
 * The directory of a relative path while it is typed, e.g. `./assets/` of `./assets/so`.
 * `null` for urls and absolute paths, which are not completed.
 */
export const typedDirectory = (typed: string) => {
    if (typed.startsWith('/') || /^[a-z]+:/i.test(typed)) {
        return null;
    }
    const lastSlash = typed.lastIndexOf('/');
    return lastSlash < 0 ? './' : typed.slice(0, lastSlash + 1);
};
