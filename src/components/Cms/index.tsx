import Layout from '@theme/Layout';

import { matchPath, Redirect, useHistory, useLocation } from '@docusaurus/router';
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

const CmsLandingPage = observer(() => {
    const cmsStore = useStore('cmsStore');
    const access = useGithubAccess();
    const { settings, github, activeEntry, viewStore } = cmsStore;
    const entry = useLoadedFile(activeEntry);
    if (access === 'no-token') {
        return <Redirect to={'/gh-login'} />;
    }
    if (access === 'loading' || !settings || !github || !entry) {
        return <Layout>Loading...</Layout>;
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
    fileToEdit?: string;
}

const PATHNAME_PATTERN = '/cms/*' as const;

const WithFileToEdit = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const history = useHistory();
    React.useEffect(() => {
        if (props.fileToEdit) {
            cmsStore.settings?.setActivePath(props.fileToEdit, true);
            history.replace(`/cms`);
        }
    }, [props.fileToEdit, history]);
    return <CmsLandingPage />;
});

const Cms = observer(() => {
    const location = useLocation();
    const routeParams = matchPath<string[]>(location.pathname, PATHNAME_PATTERN);
    const fileToEdit = routeParams?.params[0];
    return (
        <Layout title={`CMS`} description="Github">
            <BrowserOnly fallback={<Loader />}>
                {() => {
                    return <WithFileToEdit fileToEdit={fileToEdit} />;
                }}
            </BrowserOnly>
        </Layout>
    );
});

export default Cms;
