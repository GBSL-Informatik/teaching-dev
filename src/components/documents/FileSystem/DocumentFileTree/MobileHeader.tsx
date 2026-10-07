import { mdiChevronDown, mdiChevronUp, mdiFolderOpenOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

interface Props {
    name?: string;
    treeId: string;
}

const MobileHeader = observer((props: Props) => {
    const dir = useDocument<'dir'>();
    const viewStore = useStore('viewStore');
    const selectedFile = viewStore.getSelectedFile(dir.id);
    const isExpanded = viewStore.isMobileFileTreeExpanded(dir.id);

    return (
        <button
            type="button"
            className={clsx(styles.mobileHeader, 'button button--secondary')}
            aria-expanded={isExpanded}
            aria-controls={props.treeId}
            title={selectedFile?.filePath}
            onClick={() => viewStore.setMobileFileTreeExpanded(dir.id, !isExpanded)}
        >
            <Icon path={mdiFolderOpenOutline} size={SIZE_S} />
            <span className={styles.mobileHeaderLabel}>
                <small className={styles.mobileHeaderTitle}>{props.name || 'Dateien'}</small>
                <span className={styles.mobileHeaderFile}>{selectedFile?.name || 'Datei auswählen'}</span>
            </span>
            <Icon path={isExpanded ? mdiChevronUp : mdiChevronDown} size={SIZE_S} />
        </button>
    );
});

export default MobileHeader;
