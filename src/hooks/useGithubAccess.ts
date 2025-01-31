import React from 'react';
import { useStore } from '@tdev-hooks/useStore';

export const useGithubAccess = () => {
    const cmsStore = useStore('cmsStore');
    React.useEffect(() => {
        cmsStore.initialize();
    }, []);
    if (cmsStore.initialized) {
        return cmsStore.settings ? 'access' : 'no-token';
    }
    return 'loading';
};
