export const trimSlashes = (path: string) => {
    if (path === '/') {
        return path;
    }
    return path.replace(/^\/+|\/+$/g, '');
};
