import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { default as PrModel } from '@tdev-models/cms/PR';
import Badge from '@tdev-components/shared/Badge';
import Icon from '@mdi/react';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import {
    mdiCloseCircle,
    mdiEye,
    mdiEyeOff,
    mdiLoading,
    mdiRecordCircleOutline,
    mdiReload,
    mdiSourceBranchSync,
    mdiSourceCommit,
    mdiSourceMerge,
    mdiSync
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { ApiState } from '@tdev-stores/iStore';
import Link from '@docusaurus/Link';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';

type PRElements =
    | 'prName'
    | 'reload'
    | 'preview'
    | 'commits'
    | 'merged'
    | 'closed'
    | 'blocked'
    | 'draft'
    | 'sync'
    | 'rebase'
    | 'merge'
    | 'spacer';

interface Props {
    pr: PrModel;
    compact?: boolean;
    className?: string;
    classNames?: { [key in PRElements]?: string };
}

const PR = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { pr, classNames } = props;
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
        <div className={clsx(styles.PR, props.className)}>
            <Badge noPaddingLeft className={clsx(classNames?.prName)}>
                <Icon path={mdiRecordCircleOutline} size={SIZE_XS} color="var(--ifm-color-success)" />
                <Link
                    to={pr.htmlUrl}
                    target="_blank"
                    title={pr.title}
                    className={clsx(styles.link, props.compact && styles.compact)}
                >
                    {pr.title}
                </Link>
            </Badge>
            <Button
                icon={pr.apiState === ApiState.SYNCING ? mdiLoading : mdiSync}
                spin={pr.apiState === ApiState.SYNCING}
                onClick={() => {
                    pr.sync();
                }}
                size={SIZE_S}
                title="PR Status aktualisieren"
                className={clsx(classNames?.reload)}
            />
            <div className={clsx(styles.spacer, classNames?.spacer)}></div>
            <Button
                icon={pr.hasPreview ? mdiEye : mdiEyeOff}
                size={SIZE_S}
                color={pr.hasPreview ? 'blue' : 'orange'}
                title={
                    pr.hasPreview
                        ? 'Preview wird beim nächsten Speichern veröffentlicht'
                        : 'Preview wird nicht mehr veröffentlicht'
                }
                onClick={() => {
                    pr.setPreview(!pr.hasPreview);
                }}
                className={clsx(classNames?.preview)}
            />
            {pr.branch && (pr.branch.aheadBy > 0 || pr.branch.behindBy > 0) && (
                <Badge
                    noPaddingLeft
                    style={{ gap: 0 }}
                    title={`Branch ist ${pr.branch.aheadBy} Commits vor- und ${pr.branch.behindBy} Commits hinter dem ${github.defaultBranchName}-Branch`}
                    className={clsx(classNames?.commits)}
                >
                    <Icon path={mdiSourceCommit} size={SIZE_XS} />+{pr.branch.aheadBy}
                    {pr.branch.behindBy > 0 && `/-${pr.branch.behindBy}`}
                </Badge>
            )}
            {pr.merged && (
                <Badge noPaddingLeft title={`Merged: ${pr.mergedAt}`} className={clsx(classNames?.merged)}>
                    <Icon path={mdiSourceMerge} size={SIZE_XS} color="var(--ifm-color-violet)" /> Merged
                </Badge>
            )}
            {pr.state === 'closed' && (
                <Badge noPaddingLeft title={`Merged: ${pr.updatedAt}`} className={clsx(classNames?.closed)}>
                    <Icon path={mdiCloseCircle} size={SIZE_XS} color="var(--ifm-color-danger)" /> Closed
                </Badge>
            )}
            {pr.hasBlockingLabel && (
                <Badge type="danger" className={clsx(classNames?.blocked)}>
                    Blocked
                </Badge>
            )}
            {pr.isDraft && (
                <Badge type="danger" className={clsx(classNames?.draft)}>
                    Draft
                </Badge>
            )}
            {pr.isClosed && (
                <Badge type="danger" className={clsx(classNames?.closed)}>
                    Closed
                </Badge>
            )}
            {pr.isSynced && (
                <>
                    {pr.branch && pr.mergeableState === 'clean' && pr.branch.behindBy > 0 && (
                        <Confirm
                            icon={mdiSourceBranchSync}
                            size={SIZE_S}
                            color="blue"
                            title={`Rebase ${github.defaultBranchName} into ${pr.branchName}`}
                            confirmText={`Rebase ${github.defaultBranchName}?`}
                            onConfirm={() => {
                                github.rebaseBranch(github.defaultBranchName!, pr.branchName);
                            }}
                            className={clsx(classNames?.rebase)}
                        />
                    )}
                    <Confirm
                        icon={mdiSourceMerge}
                        color="green"
                        size={SIZE_S}
                        onConfirm={() => {
                            github.mergePR(pr.number);
                        }}
                        disabled={!pr.canMerge}
                        text={''}
                        confirmText="Mergen?"
                        title={`In den ${github.defaultBranchName}-Branch Mergen: ${pr.mergeableState}`}
                        className={clsx(classNames?.merge)}
                    />
                </>
            )}
        </div>
    );
});

export default PR;
