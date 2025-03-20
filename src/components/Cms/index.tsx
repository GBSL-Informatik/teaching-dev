import Layout from '@theme/Layout';

import { matchPath, Redirect, useHistory, useLocation } from '@docusaurus/router';
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
const { organizationName, projectName } = siteConfig;

const parseLocation = (location: Location) => {
    const routeParams =
        matchPath<Pattern>(location.pathname, PATHNAME_PATTERN_WITH_FILE) ??
        matchPath<Pattern>(location.pathname, PATHNAME_PATTERN);
    const fileToEdit = routeParams?.params[0];
    const { repoName, repoOwner } = routeParams?.params ?? {
        repoName: projectName!,
        repoOwner: organizationName!
    };
    return { fileToEdit, repoName, repoOwner };
};

const CmsLandingPage = observer(() => {
    const cmsStore = useStore('cmsStore');
    const access = useGithubAccess();
    const { settings, activeEntry, viewStore } = cmsStore;
    const entry = useLoadedFile(activeEntry);
    const history = useHistory();
    const historyKeys = React.useRef<string[]>([]);
    const historyLocation = React.useRef<number>(-1);
    const skipMobx = React.useRef(false);
    React.useEffect(() => {
        const disposer = reaction(
            () => cmsStore.activeFilePath,
            (activePath) => {
                if (activePath !== history.location.pathname) {
                    if (skipMobx.current) {
                        skipMobx.current = false;
                        return;
                    }
                    historyKeys.current.splice(historyKeys.current.length + historyLocation.current + 1);
                    historyLocation.current = -1;
                    history.push(`/cms/${cmsStore.repoOwner}/${cmsStore.repoName}/${activePath ?? ''}`);
                }
            }
        );
        return disposer;
    }, [cmsStore.github, history]);
    React.useEffect(() => {
        return history.listen((location) => {
            let updateFile = true;

            if (
                historyKeys.current[historyKeys.current.length + historyLocation.current - 1] === location.key
            ) {
                historyLocation.current -= 1;
            } else if (
                historyLocation.current < -1 &&
                historyKeys.current[historyKeys.current.length + historyLocation.current + 1] === location.key
            ) {
                historyLocation.current += 1;
            } else {
                updateFile = false;
                if (
                    historyKeys.current.length > 1 &&
                    Math.abs(historyLocation.current) === historyKeys.current.length
                ) {
                    return;
                }
                if (location.key) {
                    historyKeys.current.push(location.key);
                }
            }
            if (updateFile) {
                try {
                    const loc = parseLocation(location);
                    skipMobx.current = true;
                    if (loc.fileToEdit) {
                        cmsStore.settings?.setActivePath(loc.fileToEdit, true);
                    } else {
                        cmsStore.settings?.setActivePath('', true);
                    }
                } catch (e) {
                    console.error(e);
                    skipMobx.current = false;
                }
            }
        });
    }, [history]);
    if (access === 'no-token') {
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
    initialConfig: { repoOwner: string; repoName: string; fileToEdit?: string };
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
    React.useEffect(() => {
        const { repoName, repoOwner, fileToEdit } = props.initialConfig;
        cmsStore.configureRepo(repoOwner, repoName);
        if (fileToEdit) {
            cmsStore.settings?.setActivePath(fileToEdit, true);
        }
    }, [props.initialConfig]);
    return <CmsLandingPage />;
});

const Cms = observer(() => {
    const location = useLocation();
    const initialConfig = React.useMemo(() => parseLocation(location), []);
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
