import React from 'react';

const cachedLibs = new Map<string, any>();
export const useClientLib = <T>(dynamicImport: () => Promise<T>, moduleName?: string): T | null => {
    const [Lib, setLib] = React.useState<T>(moduleName ? cachedLibs.get(moduleName) : null);
    React.useEffect(() => {
        if (Lib) {
            setLib(Lib);
            return;
        }
        dynamicImport()
            .then((Lib) => {
                setLib(Lib);
                if (moduleName) {
                    cachedLibs.set(moduleName, Lib);
                }
            })
            .catch((e) => {
                console.error(e);
            });
    }, []);
    return Lib || null;
};
