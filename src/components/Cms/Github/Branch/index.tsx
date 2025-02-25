import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Delete } from '@tdev-components/shared/Button/Delete';
import Badge from '@tdev-components/shared/Badge';
import Icon from '@mdi/react';
import {
    mdiGit,
    mdiPlusCircleMultipleOutline,
    mdiReload,
    mdiSourceBranch,
    mdiSourceCommit,
    mdiSync
} from '@mdi/js';
import { default as BranchModel } from '@tdev-models/cms/Branch';
import Button from '@tdev-components/shared/Button';
import Popup from 'reactjs-popup';
import NewPR from '../PR/NewPR';
import { PopupActions } from 'reactjs-popup/dist/types';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
type BranchElements = 'name' | 'spacer' | 'delete' | 'commits' | 'reload' | 'defaultBranch' | 'createPr';
interface Props {
    branch: BranchModel;
    className?: string;
    classNames?: { [key in BranchElements]?: string };
}

const Branch = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const github = cmsStore.github;
    const ref = React.useRef<PopupActions>(null);

    const { branch, classNames } = props;
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
        <div className={clsx(styles.branch, props.className)}>
            <Badge noPaddingLeft className={clsx(classNames?.name)}>
                <Icon path={mdiSourceBranch} color="var(--ifm-color-blue)" size={0.8} />
                <span className={clsx(styles.name)}>{branch.name}</span>
            </Badge>
            <div className={clsx(styles.spacer, classNames?.spacer)}></div>
            <Button
                icon={mdiSync}
                size={SIZE_S}
                onClick={() => {
                    github.fetchBranches();
                    branch.sync();
                }}
                title="Branch Status aktualisieren"
                className={clsx(classNames?.reload)}
            />
            {github.defaultBranchName !== branch.name ? (
                <>
                    {branch.aheadBy > 0 && (
                        <div className={clsx(classNames?.createPr)}>
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
                    <div className={clsx(styles.spacer, classNames?.spacer)}></div>
                    <Badge
                        noPaddingLeft
                        style={{ gap: 0 }}
                        title={`Branch ist ${branch.aheadBy} Commits vor- und ${branch.behindBy} Commits hinter dem ${github.defaultBranchName}-Branch`}
                        className={clsx(classNames?.commits)}
                    >
                        <Icon path={mdiSourceCommit} size={SIZE_XS} />+{branch.aheadBy}
                        {branch.behindBy > 0 && `/-${branch.behindBy}`}
                    </Badge>
                </>
            ) : (
                <Badge noPadding title="Standard Branch" className={clsx(classNames?.defaultBranch)}>
                    <Icon path={mdiGit} size={SIZE_S} color="var(--ifm-color-blue)" />
                </Badge>
            )}
            {github.defaultBranchName !== branch.name && (
                <Delete
                    title="Branch löschen"
                    onDelete={() => {
                        if (associatedPr) {
                            github.closeAndDeletePr(associatedPr.number);
                        } else {
                            github.deleteBranch(branch.name);
                        }
                    }}
                    size={SIZE_S}
                    className={clsx(styles.delete, classNames?.delete)}
                    text={''}
                />
            )}
        </div>
    );
});

export default Branch;
