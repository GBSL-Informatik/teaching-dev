import { Redirect, useLocation } from '@docusaurus/router';
import Loader from '@tdev-components/Loader';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../hooks/useCmsStore';
import { useGithubAccess } from '../../hooks/useGithubAccess';
import { useRequestedNavigation } from '../../hooks/useRequestedNavigation';
import { cmsUrl, parseCmsUrl } from '../../models/cmsLocation';

interface Props {
    children: React.ReactNode;
}

/**
 * Opens the location of the url `/cms/<owner>/<name>/<path>?ref=<branch>`:
 * - without a branch and a file, the last visited location is restored, see `VisitStore`
 * - the location is remembered before the logins, which return to `/cms`
 * - without a branch, the default branch of the repository is opened
 */
const CmsRoute = observer(({ children }: Props) => {
    const cmsStore = useCmsStore();
    const userStore = useStore('userStore');
    const access = useGithubAccess();
    const { pathname, search } = useLocation();
    const request = React.useMemo(() => parseCmsUrl(pathname, search), [pathname, search]);
    const { visits } = cmsStore;
    const restored = visits.isLoaded ? visits.restore(request) : undefined;
    const canOpen = visits.isLoaded && !restored;
    useRequestedNavigation();

    // runs before the redirect to the login is followed, so the request is remembered
    React.useEffect(() => {
        if (canOpen && request) {
            cmsStore.open(request);
        }
    }, [cmsStore, request, canOpen]);

    if (!visits.isLoaded) {
        return <Loader label="Laden..." />;
    }
    if (restored) {
        return <Redirect to={cmsUrl(restored)} />;
    }
    if (access === 'no-token' || !userStore.current) {
        return <Redirect to="/gh-login" />;
    }
    if (access === 'loading' || !request) {
        return <Loader label="Laden..." />;
    }
    if (!request.branch) {
        const defaultBranch = cmsStore.defaultBranchOf(request.repo);
        if (!defaultBranch) {
            return <Loader label="Repository laden..." />;
        }
        return <Redirect to={cmsUrl({ ...request, branch: defaultBranch })} />;
    }
    return children;
});

export default CmsRoute;
