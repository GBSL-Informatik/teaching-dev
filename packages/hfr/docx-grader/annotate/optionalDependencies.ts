/**
 * node-canvas and sharp are optional dependencies: their native modules are skipped when they
 * cannot be installed, which must not break `yarn install` for everyone. Only the `annotate` CLI
 * needs them.
 */
export const loadCanvas = () => loadOptional('canvas', () => import('canvas'));

export const loadSharp = () => loadOptional('sharp', async () => (await import('sharp')).default);

const loadOptional = async <T>(name: string, load: () => Promise<T>): Promise<T> => {
    try {
        return await load();
    } catch {
        throw new Error(
            `Das Paket «${name}» ist nicht installiert; es wird für die annotierten Bilder gebraucht.`
        );
    }
};
