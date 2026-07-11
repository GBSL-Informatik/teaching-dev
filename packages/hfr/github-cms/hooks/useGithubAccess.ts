import React from 'react';
import { useCmsStore } from '../hooks/useCmsStore';

export const useGithubAccess = () => {
    const cmsStore = useCmsStore();
    React.useEffect(() => {
        cmsStore.initialize();
    }, []);
    if (cmsStore.initialized) {
        return cmsStore.settings ? 'access' : 'no-token';
    }
    return 'loading';
};
