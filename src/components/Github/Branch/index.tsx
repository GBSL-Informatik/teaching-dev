import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { GhBranch } from '@tdev-models/cms/Github';
import { Delete } from '@tdev-components/shared/Button/Delete';
import Badge from '@tdev-components/shared/Badge';
import Icon, { Stack } from '@mdi/react';
import {
    mdiAlert,
    mdiCircleOutline,
    mdiCircleSmall,
    mdiGit,
    mdiMerge,
    mdiPlus,
    mdiPlusCircleMultipleOutline,
    mdiPlusCircleOutline,
    mdiReload,
    mdiSourceBranch,
    mdiSourceBranchSync,
    mdiSourceCommit,
    mdiSourceMerge,
    mdiSyncCircle
} from '@mdi/js';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { default as BranchModel, MergeStatus } from '@tdev-models/cms/Branch';
import Button from '@tdev-components/shared/Button';
import { ApiState } from '@tdev-stores/iStore';
import Popup from 'reactjs-popup';
import Card from '@tdev-components/shared/Card';
import NewPR from '../PR/NewPR';
import { PopupActions } from 'reactjs-popup/dist/types';
interface Props {
    branch: BranchModel;
}

const Branch = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const github = cmsStore.github;
    const ref = React.useRef<PopupActions>(null);

    const { branch } = props;
    React.useEffect(() => {
        if (github?.defaultBranchName) {
            branch.sync();
        }
    }, [github?.defaultBranchName, branch]);
    if (!github) {
        return null;
    }
    const associatedPr = cmsStore.findPrByBranch(branch.name);

    return (
        <div className={clsx(styles.branch)}>
            <Badge noPaddingLeft>
                <Icon path={mdiSourceBranch} color="var(--ifm-color-blue)" size={0.8} />
                {branch.name}
            </Badge>
            <div className={clsx(styles.spacer)}></div>
            {github.defaultBranchName !== branch.name ? (
                <>
                    {branch.aheadBy > 0 && (
                        <div>
                            <Popup
                                trigger={
                                    <span>
                                        <Button
                                            icon={mdiPlusCircleMultipleOutline}
                                            color="green"
                                            size={0.8}
                                            text="PR"
                                            iconSide="left"
                                            title="Erstelle neuen PR"
                                        />
                                    </span>
                                }
                                ref={ref}
                                modal
                                on="click"
                                overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                            >
                                <NewPR
                                    branch={branch}
                                    onDiscard={() => ref.current?.close()}
                                    onDone={() => {
                                        ref.current?.close();
                                    }}
                                />
                            </Popup>
                        </div>
                    )}
                    <div className={clsx(styles.spacer)}></div>
                    <Badge
                        noPaddingLeft
                        style={{ gap: 0 }}
                        title={`Branch ist ${branch.aheadBy} Commits vor- und ${branch.behindBy} Commits hinter dem ${github.defaultBranchName}-Branch`}
                    >
                        <Icon path={mdiSourceCommit} size={0.8} />+{branch.aheadBy}
                        {branch.behindBy > 0 && `/-${branch.behindBy}`}
                    </Badge>
                    <Button
                        icon={mdiReload}
                        color="grey"
                        onClick={() => {
                            github.fetchBranches();
                            branch.sync();
                        }}
                        title="Branch Status aktualisieren"
                    />
                    <Delete
                        onDelete={() => {
                            if (associatedPr) {
                                github.closeAndDeletePr(associatedPr.number);
                            } else {
                                github.deleteBranch(branch.name);
                            }
                        }}
                        className={clsx(styles.delete)}
                        text={''}
                    />
                </>
            ) : (
                <Badge noPadding title="Standard Branch">
                    <Icon path={mdiGit} size={0.8} color="var(--ifm-color-blue)" />
                </Badge>
            )}
        </div>
    );
});

export default Branch;
