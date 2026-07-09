import React from 'react';
import { useCmsStore } from '@site/packages/hfr/github-cms/hooks/useCmsStore';
import { useHistory } from 'react-router';
import { useLocation } from '@docusaurus/router';

export const useCmsNavigator = () => {
    const cmsStore = useCmsStore();
    const history = useHistory();
    const location = useLocation();
    const openFile = React.useMemo(() => {
        return (branch: string | undefined, activePath?: string | null) => {
            const current = `${location.pathname}${location.search}`;
            const requested = `/cms/${cmsStore.repoOwner}/${cmsStore.repoName}/${activePath ?? ''}${branch ? `?ref=${branch}` : ''}`;
            if (current === requested) {
                return;
            }
            history.push(requested);
        };
    }, [cmsStore.repoOwner, cmsStore.repoName, history, location]);
    return { openFile };
};
