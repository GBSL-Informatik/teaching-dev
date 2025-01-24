import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as PrModel } from '@tdev-models/cms/PR';
import Badge from '@tdev-components/shared/Badge';
import Icon, { Stack } from '@mdi/react';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import {
    mdiCircleOutline,
    mdiCircleSmall,
    mdiCloseCircle,
    mdiLoading,
    mdiMerge,
    mdiRecordCircleOutline,
    mdiReload,
    mdiSourceBranchRefresh,
    mdiSourceBranchSync,
    mdiSourceCommit,
    mdiSourceMerge,
    mdiSyncCircle
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { ApiState } from '@tdev-stores/iStore';
import Link from '@docusaurus/Link';

interface Props {
    pr: PrModel;
}

const PR = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { pr } = props;
    const github = cmsStore.github;
    React.useEffect(() => {
        if (github?.defaultBranchName) {
            pr.sync();
        }
    }, [pr]);

    if (!github) {
        return null;
    }

    return (
        <div className={clsx(styles.PR)}>
            <Badge noPaddingLeft>
                <Icon path={mdiRecordCircleOutline} size={0.8} color="var(--ifm-color-success)" />
                <Link to={pr.htmlUrl} target="_blank">
                    {pr.title}
                </Link>
            </Badge>
            <Button
                icon={pr.apiState === ApiState.SYNCING ? mdiLoading : mdiReload}
                spin={pr.apiState === ApiState.SYNCING}
                color="grey"
                onClick={() => {
                    pr.sync();
                }}
                size={0.8}
                title="PR Status aktualisieren"
            />
            <div className={clsx(styles.spacer)}></div>
            {pr.branch && (pr.branch.aheadBy > 0 || pr.branch.behindBy > 0) && (
                <Badge
                    noPaddingLeft
                    style={{ gap: 0 }}
                    title={`Branch ist ${pr.branch.aheadBy} Commits vor- und ${pr.branch.behindBy} Commits hinter dem ${github.defaultBranchName}-Branch`}
                >
                    <Icon path={mdiSourceCommit} size={0.8} />+{pr.branch.aheadBy}
                    {pr.branch.behindBy > 0 && `/-${pr.branch.behindBy}`}
                </Badge>
            )}
            {pr.merged && (
                <Badge noPaddingLeft title={`Merged: ${pr.mergedAt}`}>
                    <Icon path={mdiSourceMerge} size={0.8} color="var(--ifm-color-violet)" /> Merged
                </Badge>
            )}
            {pr.state === 'closed' && (
                <Badge noPaddingLeft title={`Merged: ${pr.updatedAt}`}>
                    <Icon path={mdiCloseCircle} size={0.8} color="var(--ifm-color-danger)" /> Closed
                </Badge>
            )}
            {pr.hasBlockingLabel && <Badge type="danger">Blocked</Badge>}
            {pr.isDraft && <Badge type="danger">Draft</Badge>}
            {pr.isClosed && <Badge type="danger">Closed</Badge>}
            {pr.isSynced && (
                <>
                    {pr.branch && pr.mergeableState === 'clean' && pr.branch.behindBy > 0 && (
                        <Confirm
                            icon={mdiSourceBranchSync}
                            color="blue"
                            title={`Rebase ${github.defaultBranchName} into ${pr.branchName}`}
                            confirmText={`Rebase ${github.defaultBranchName}?`}
                            onConfirm={() => {
                                github.rebaseBranch(github.defaultBranchName!, pr.branchName);
                            }}
                        />
                    )}
                    <Confirm
                        icon={mdiSourceMerge}
                        color="green"
                        onConfirm={() => {
                            github.mergePR(pr.number);
                        }}
                        disabled={!pr.canMerge}
                        text={''}
                        confirmText="Mergen?"
                        title={`In den ${github.defaultBranchName}-Branch Mergen: ${pr.mergeableState}`}
                    />
                </>
            )}
        </div>
    );
});

export default PR;
