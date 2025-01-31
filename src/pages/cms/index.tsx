import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
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
import DefaultEditor from '@tdev-components/Github/DefaultEditor';
import styles from './styles.module.scss';

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
            <main className={clsx(styles.cms)}>
                <PathNav item={activeEntry} />
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
                {activeEntry.type === 'dir' ? (
                    <Directory dir={activeEntry} />
                ) : (
                    <>
                        {activeEntry.type === 'file' && activeEntry.content !== undefined ? (
                            <>
                                {activeEntry.isImage && <ImagePreview file={activeEntry} />}
                                {activeEntry.isMarkdown && (
                                    <MdxEditor file={activeEntry} key={activeEntry.downloadUrl} />
                                )}
                                {!activeEntry.isImage && !activeEntry.isMarkdown && (
                                    <DefaultEditor file={activeEntry} />
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
            </main>
        </Layout>
    );
});
export default GhCallback;
