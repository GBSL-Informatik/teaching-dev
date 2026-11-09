import { mdiImageOutline } from '@mdi/js';
import Icon from '@mdi/react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type iFile from '../../../models/iFile';
import styles from './styles.module.scss';

interface Props {
    image: iFile;
}

/**
 * A thumbnail of an image in the repository. The image is loaded when the thumbnail is shown.
 */
const RepoImagePreview = observer(({ image }: Props) => {
    const cmsStore = useCmsStore();
    const entry = cmsStore.findEntry(image.branch, image.path);

    React.useEffect(() => {
        if (entry?.type === 'file_stub' && !entry.isSyncing) {
            cmsStore.fetchFile(entry);
        }
    }, [entry, cmsStore]);

    if (entry?.type !== 'bin_file') {
        return <Icon path={mdiImageOutline} size="1.1em" className={clsx(styles.preview)} />;
    }
    return <img src={entry.src} alt="" className={clsx(styles.preview)} />;
});

export default RepoImagePreview;
