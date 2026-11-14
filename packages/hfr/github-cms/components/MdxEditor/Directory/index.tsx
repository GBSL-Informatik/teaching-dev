import Card from '@tdev-components/shared/Card';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import { default as DirModel } from '../../../models/Dir';
import Dir from '../../Github/iFile/Dir';
import RepositoryOverviewButton from '../../Github/RepositoryOverviewButton';
import UserAvatar from '../../Github/UserAvatar';
import styles from './styles.module.scss';
import UploadDialog, { type DroppedFiles } from './UploadDialog';

interface Props {
    dir?: DirModel;
    className?: string;
    contentClassName?: string;
    showActions?: 'always' | 'hover';
    compact?: boolean;
    showAvatar?: boolean;
}

const Directory = observer((props: Props) => {
    const { dir } = props;
    const cmsStore = useCmsStore();
    const [upload, setUpload] = React.useState<DroppedFiles | null>(null);
    const handleDropFiles = React.useCallback(
        (dir: DirModel, files: File[]) => setUpload({ dir, files }),
        []
    );
    React.useEffect(() => {
        if (dir && !dir.isOpen) {
            dir.setOpen(true);
        }
    }, [dir]);
    if (!dir) {
        return null;
    }

    return (
        <div className={clsx(styles.directory, props.className, props.compact && styles.compact)}>
            {props.showAvatar && (
                <div className={clsx(styles.account)}>
                    <UserAvatar />
                    <RepositoryOverviewButton />
                </div>
            )}
            <Card
                classNames={{
                    body: styles.cardBody,
                    card: props.contentClassName
                }}
            >
                <ul className={clsx(styles.dirTree)}>
                    <Dir
                        dir={dir}
                        showActions={props.showActions}
                        onDropFiles={cmsStore.canModifyActiveBranch ? handleDropFiles : undefined}
                    />
                </ul>
            </Card>
            <UploadDialog upload={upload} onClose={() => setUpload(null)} />
        </div>
    );
});

export default Directory;
