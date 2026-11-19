/**
 * node-canvas is an optional dependency: its native module is skipped when it cannot be installed,
 * which must not break `yarn install` for everyone. Only the `annotate` CLI needs it.
 */
export const loadCanvas = async () => {
    try {
        return await import('canvas');
    } catch {
        throw new Error(
            'Das Paket «canvas» ist nicht installiert; es wird für die annotierten Bilder gebraucht.'
        );
    }
};
