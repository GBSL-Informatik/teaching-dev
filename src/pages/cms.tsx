import React from 'react';
import clsx from 'clsx';
import styles from './login.module.scss';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import CodeBlock from '@theme/CodeBlock';
import File from '@tdev-components/Github/iFile/File';
import Dir from '@tdev-components/Github/iFile/Dir';
import MdxEditor from '@tdev-components/MdxEditor';
import Selector from '@tdev-components/Github/Branch/Selector';
import { useGithubAccess } from '@tdev-hooks/useGithubAccess';
import { Redirect } from '@docusaurus/router';
import Details from '@theme/Details';
import { ApiState } from '@tdev-stores/iStore';
import Loader from '@tdev-components/Loader';
import Card from '@tdev-components/shared/Card';
import Branch from '@tdev-components/Github/Branch';
import PR from '@tdev-components/Github/PR';
import PathNav from '@tdev-components/MdxEditor/PathNav';
import Directory from '@tdev-components/MdxEditor/Directory';
import ImagePreview from '@tdev-components/Github/iFile/File/ImagePreview';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', 'gugus', styles.heroBanner)}>
            <div className="container">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
            </div>
        </header>
    );
}

const GhCallback = observer(() => {
    const cmsStore = useStore('cmsStore');
    const access = useGithubAccess();
    const { settings, github, activeEntry } = cmsStore;

    if (access === 'no-token') {
        return <Redirect to={'/gh-login'} />;
    }
    if (access === 'loading' || !settings || !github || !activeEntry) {
        return <Layout>Loading...</Layout>;
    }

    return (
        <Layout>
            <HomepageHeader />
            <main>
                <Selector
                    onSelect={(branchName) => {
                        if (cmsStore.branchNames.includes(branchName)) {
                            cmsStore.setBranch(branchName);
                        } else {
                            github.createNewBranch(branchName).then((branch) => {
                                cmsStore.setBranch(branchName);
                            });
                        }
                    }}
                />
                <PathNav item={activeEntry} />
                {activeEntry.type === 'dir' ? (
                    <Directory dir={activeEntry} />
                ) : (
                    <>
                        {activeEntry.type === 'file' && activeEntry.content ? (
                            <>
                                {activeEntry.isImage ? (
                                    <ImagePreview file={activeEntry} />
                                ) : (
                                    <MdxEditor file={activeEntry} key={activeEntry.downloadUrl} />
                                )}
                            </>
                        ) : (
                            <>
                                {github.apiStates.get(
                                    `${settings.activeBranchName}:${settings.activePath}`
                                ) === ApiState.SYNCING && (
                                    <Card>
                                        <Loader
                                            label={`${settings.activeBranchName}:${settings.activePath} wird geladen...`}
                                            size={2}
                                        />
                                    </Card>
                                )}
                            </>
                        )}
                    </>
                )}
                <Details summary={'PRs'} open>
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
            </main>
        </Layout>
    );
});
export default GhCallback;
