import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '@tdev/github-cms/hooks/useCmsStore';
import { default as PrModel } from '@tdev/github-cms/models/PR';
import { mdiDotsHorizontalCircleOutline, mdiDotsVerticalCircleOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import PR from '..';

interface Props {
    pr: PrModel;
}

const ExpandableOverview = observer((props: Props) => {
    const { pr } = props;
    const cmsStore = useCmsStore();
    const { github, viewStore } = cmsStore;
    if (!github) {
        return null;
    }

    return (
        <div className={clsx(styles.PrState, viewStore.isNavOverviewExpanded && styles.expanded)}>
            <PR
                pr={pr}
                className={clsx(styles.pr)}
                classNames={{
                    prName: styles.prName,
                    reload: styles.reload,
                    preview: styles.preview,
                    commits: styles.commits,
                    merged: styles.merged,
                    closed: styles.closed,
                    blocked: styles.blocked,
                    draft: styles.draft,
                    sync: styles.sync,
                    rebase: styles.rebase,
                    merge: styles.merge,
                    spacer: styles.prSpacer
                }}
            />
            <Button
                icon={
                    viewStore.isNavOverviewExpanded
                        ? mdiDotsHorizontalCircleOutline
                        : mdiDotsVerticalCircleOutline
                }
                onClick={() => viewStore.setIsNavOverviewExpanded(!viewStore.isNavOverviewExpanded)}
                size={SIZE_S}
                title={viewStore.isNavOverviewExpanded ? 'Optionen schliessen' : 'Mehr anzeigen'}
                color={viewStore.isNavOverviewExpanded ? 'blue' : undefined}
            />
        </div>
    );
});

export default ExpandableOverview;
