import React from 'react';
import { useCmsStore } from '@tdev/github-cms/hooks/useCmsStore';

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
