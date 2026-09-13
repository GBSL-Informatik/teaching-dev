import { mdiDotsHorizontalCircleOutline, mdiDotsVerticalCircleOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Branch from '..';
import { useCmsStore } from '../../../../hooks/useCmsStore';
import { default as BranchModel } from '../../../../models/Branch';
import styles from './styles.module.scss';

interface Props {
    branch: BranchModel;
}

const ExpandableOverview = observer((props: Props) => {
    const { branch } = props;
    const cmsStore = useCmsStore();
    const { github, viewStore } = cmsStore;
    if (!github) {
        return null;
    }

    return (
        <div className={clsx(styles.branchState, viewStore.isNavOverviewExpanded && styles.expanded)}>
            <Branch
                branch={branch}
                className={clsx(styles.branch)}
                classNames={{
                    name: styles.name,
                    spacer: styles.branchSpacer,
                    delete: styles.delete,
                    commits: styles.commits,
                    reload: styles.reload,
                    defaultBranch: styles.defaultBranch,
                    createPr: styles.createPr
                }}
            />
            {!cmsStore.isOnDefaultBranch && (
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
            )}
        </div>
    );
});

export default ExpandableOverview;
