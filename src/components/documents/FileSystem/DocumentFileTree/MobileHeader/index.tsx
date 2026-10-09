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
    className?: string;
}

const MobileHeader = observer((props: Props) => {
    const dir = useDocument<'dir'>();
    const { fileTreeView } = useStore('viewStore');
    const selectedFile = fileTreeView.getSelectedFile(dir.id);
    const isExpanded = fileTreeView.isMobileFileTreeExpanded(dir.id);

    return (
        <button
            type="button"
            className={clsx(styles.header, 'button button--secondary', props.className)}
            aria-expanded={isExpanded}
            aria-controls={props.treeId}
            title={selectedFile?.filePath}
            onClick={() => fileTreeView.setMobileFileTreeExpanded(dir.id, !isExpanded)}
        >
            <Icon path={mdiFolderOpenOutline} size={SIZE_S} />
            <span className={styles.label}>
                <small className={styles.title}>{props.name || 'Dateien'}</small>
                <span className={styles.file}>{selectedFile?.name || 'Datei auswählen'}</span>
            </span>
            <Icon path={isExpanded ? mdiChevronUp : mdiChevronDown} size={SIZE_S} />
        </button>
    );
});

export default MobileHeader;
