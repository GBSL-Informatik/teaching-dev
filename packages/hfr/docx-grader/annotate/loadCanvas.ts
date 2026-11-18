/**
 * node-canvas is an optional dependency: its native module is skipped when it cannot be built,
 * which must not break `yarn install` for everyone. Only the `annotate` CLI needs it.
 */
export const loadCanvas = async (): Promise<typeof import('canvas')> => {
    try {
        return await import('canvas');
    } catch {
        throw new Error(
            'Das Paket «canvas» ist nicht installiert (siehe https://github.com/Automattic/node-canvas#compiling).'
        );
    }
};
