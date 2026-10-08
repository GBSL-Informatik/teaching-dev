import { mdiFolderPlus, mdiMagnify } from '@mdi/js';
import { useFileTreeSearch } from '@pierre/trees/react';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import { useFileTreeModel } from '../../hooks/useFileTreeModel';
import { getFocusedDirectory } from '../actions/getFocusedDirectory';
import { syncFileTree } from '../actions/syncFileTree';
import NewFile from './NewFile';
import styles from './styles.module.scss';

interface Props {
    name?: string;
}

const Header = observer((props: Props) => {
    const model = useFileTreeModel();
    const root = useDocument<'dir'>();
    const { fileTreeView } = useStore('viewStore');
    const search = useFileTreeSearch(model);

    return (
        <div className={styles.header}>
            {props.name && <h4 className={styles.name}>{props.name}</h4>}
            <span className={styles.spacer} />
            <Button
                title="Suche"
                icon={mdiMagnify}
                size={SIZE_S}
                noBorder
                color={search.isOpen ? 'primary' : 'grey'}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
                onClick={() => {
                    if (search.isOpen) {
                        search.close();
                        return;
                    }
                    search.open();
                }}
            />
            <NewFile />
            <Button
                icon={mdiFolderPlus}
                size={SIZE_S}
                title="Neuer Ordner"
                color="grey"
                noBorder
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
                onClick={async () => {
                    const dir = getFocusedDirectory(model, root);
                    if (!dir) {
                        fileTreeView.addNotification({
                            rootId: root.id,
                            type: 'warning',
                            message: 'Kein Ordner ausgewählt, in dem ein neuer Ordner erstellt werden kann.'
                        });
                        return;
                    }
                    const newDir = await dir.createDir();
                    if (newDir) {
                        syncFileTree(model, root);
                        model.startRenaming(newDir.filePath);
                    }
                }}
            />
        </div>
    );
});

export default Header;
