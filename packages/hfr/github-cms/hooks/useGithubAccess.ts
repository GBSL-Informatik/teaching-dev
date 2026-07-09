import React from 'react';
import { useCmsStore } from '@site/packages/hfr/github-cms/hooks/useCmsStore';

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
