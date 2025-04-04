import Layout from '@theme/Layout';

import { matchPath, Redirect, useLocation } from '@docusaurus/router';
import type { Location } from 'history';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import React from 'react';
import { useStore } from '@tdev-hooks/useStore';
import { useGithubAccess } from '@tdev-hooks/useGithubAccess';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Directory from '@tdev-components/Cms/MdxEditor/Directory';
import Details from '@theme/Details';
import PR from '@tdev-components/Cms/Github/PR';
import Branch from '@tdev-components/Cms/Github/Branch';
import EditorNav from './MdxEditor/EditorNav';
import { useLoadedFile } from './MdxEditor/hooks/useLoadedFile';
import ShowFile from './ShowFile';
import siteConfig from '@generated/docusaurus.config';
import { reaction } from 'mobx';
import { useCmsNavigator } from '@tdev-hooks/useCmsNavigator';
import { FileNavigation } from '@tdev-stores/CmsStore';
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
    const cmsStore = useStore('cmsStore');
    const access = useGithubAccess();
    const { settings, activeEntry, viewStore } = cmsStore;
    const entry = useLoadedFile(activeEntry);
    if (access === 'no-token' || !userStore.current) {
        return <Redirect to={'/gh-login'} />;
    }
    if (access === 'loading' || !settings || !cmsStore.github || !entry) {
        return <Loader label="Laden..." />;
    }
    const { github } = cmsStore;

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
            <div className={clsx(styles.footer)}>
                <Details summary={'Files'}>
                    <h4>Files</h4>
                    <Directory dir={cmsStore.rootDir} />
                </Details>
                <Details summary={'PRs'}>
                    <h4>PRs und Branches</h4>
                    <ul>
                        {github.PRs.map((pr, idx) => {
                            return (
                                <li key={pr.number}>
                                    <PR pr={pr} />
                                </li>
                            );
                        })}
                    </ul>
                    <ul>
                        {github.branches
                            .filter((b) => !b.PR)
                            .map((branch, idx) => {
                                return (
                                    <li key={branch.name}>
                                        <Branch branch={branch} />
                                    </li>
                                );
                            })}
                    </ul>
                </Details>
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
    const cmsStore = useStore('cmsStore');
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
    const cmsStore = useStore('cmsStore');
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
        <Layout title={`CMS`} description="Github">
            <BrowserOnly fallback={<Loader />}>
                {() => {
                    return <WithFileToEdit initialConfig={initialConfig} />;
                }}
            </BrowserOnly>
        </Layout>
    );
});

export default Cms;
