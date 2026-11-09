import BrowserOnly from '@docusaurus/BrowserOnly';
import { matchPath, Redirect, useLocation } from '@docusaurus/router';
import siteConfig from '@generated/docusaurus.config';
import Loader from '@tdev-components/Loader';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import type { Location } from 'history';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsNavigator } from '../hooks/useCmsNavigator';
import { useCmsStore } from '../hooks/useCmsStore';
import { useGithubAccess } from '../hooks/useGithubAccess';
import { FileNavigation } from '../stores/CmsStore';
import CmsLayout from './CmsLayout';
import Directory from './MdxEditor/Directory';
import EditorNav from './MdxEditor/EditorNav';
import { useLoadedFile } from './MdxEditor/hooks/useLoadedFile';
import ShowFile from './ShowFile';
import styles from './styles.module.scss';
const { organizationName, projectName } = siteConfig;

const parseLocation = (location: Location): FileNavigation => {
    const routeParams =
        matchPath<Pattern>(location.pathname, PATHNAME_PATTERN_WITH_FILE) ??
        matchPath<Pattern>(location.pathname, PATHNAME_PATTERN);

    const searchParams = new URLSearchParams(location.search);
    const fileToEdit = routeParams?.params[0];
    const { repoName, repoOwner } = routeParams?.params ?? {
        repoName: projectName!,
        repoOwner: organizationName!
    };
    return { fileToEdit, repoName, repoOwner, branch: searchParams.get('ref') || undefined };
};

const CmsLandingPage = observer(() => {
    const userStore = useStore('userStore');
    const cmsStore = useCmsStore();
    const access = useGithubAccess();
    const { settings, activeEntry, viewStore } = cmsStore;
    const entry = useLoadedFile(activeEntry);
    if (access === 'no-token' || !userStore.current) {
        return <Redirect to={'/gh-login'} />;
    }
    if (access === 'loading' || !settings || !cmsStore.github || !entry) {
        return <Loader label="Laden..." />;
    }
    return (
        <main className={clsx(styles.cms, viewStore.showFileTree && styles.showFileTree)}>
            <div className={clsx(styles.header)}>
                <EditorNav />
            </div>
            <div className={clsx(styles.fileTree, viewStore.showFileTree && styles.showFileTree)}>
                <Directory
                    dir={cmsStore.rootDir}
                    className={clsx(styles.tree)}
                    contentClassName={clsx(styles.treeContent)}
                    showActions="hover"
                    compact
                    showAvatar
                />
            </div>
            <div className={clsx(styles.content)}>
                <ShowFile file={entry} />
            </div>
        </main>
    );
});

interface Props {
    initialConfig: FileNavigation;
}

const PATHNAME_PATTERN = '/cms/:repoOwner/:repoName' as const;
const PATHNAME_PATTERN_WITH_FILE = '/cms/:repoOwner/:repoName/*' as const;
interface Pattern {
    repoOwner: string;
    repoName: string;
    0?: string;
}

const WithFileToEdit = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const navigator = useCmsNavigator();
    const location = useLocation();
    React.useEffect(() => {
        if (cmsStore.settings) {
            const { repoName, repoOwner, fileToEdit } = props.initialConfig;
            cmsStore.configureRepo(repoOwner, repoName);
            // cmsStore.settings?.setActivePath(fileToEdit || '', true);
            navigator.openFile(props.initialConfig.branch, fileToEdit);
        }
    }, [cmsStore.settings]);
    React.useEffect(() => {
        return reaction(
            () => cmsStore.requestedNavigation,
            (requestedNavigation) => {
                if (requestedNavigation) {
                    const { fileToEdit, branch } = requestedNavigation;
                    navigator.openFile(branch, fileToEdit);
                }
            }
        );
    }, [cmsStore, navigator]);
    React.useEffect(() => {
        if (cmsStore.settings) {
            const config = parseLocation(location);
            cmsStore.configureRepo(config.repoOwner, config.repoName);
            cmsStore.settings.setLocation(
                config.branch || cmsStore.activeBranchName || cmsStore.branchNames[0] || 'main',
                config.fileToEdit || ''
            );
        }
    }, [cmsStore, location.pathname, location.search, cmsStore.settings]);
    return <CmsLandingPage />;
});

const Cms = observer(() => {
    const cmsStore = useCmsStore();
    const location = useLocation();
    const initialConfig = React.useMemo(() => {
        const config = parseLocation(location);
        if (!config.branch && !config.fileToEdit) {
            const { activeBranchName, activePath } = cmsStore.settings ?? {};
            if (activeBranchName) {
                return { ...config, branch: activeBranchName, fileToEdit: activePath };
            }
        }
        return config;
    }, [cmsStore.repoOwner, cmsStore.repoName]);
    return (
        <CmsLayout>
            <BrowserOnly fallback={<Loader />}>
                {() => {
                    return <WithFileToEdit initialConfig={initialConfig} />;
                }}
            </BrowserOnly>
        </CmsLayout>
    );
});

export default Cms;
