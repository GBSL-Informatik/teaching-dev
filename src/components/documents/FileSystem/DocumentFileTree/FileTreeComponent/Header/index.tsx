import { mdiFolderPlus, mdiMagnify } from '@mdi/js';
import { useFileTreeSearch } from '@pierre/trees/react';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useFileTreeModel } from '../../hooks/useFileTreeModel';
import NewFile from './NewFile';
import styles from './styles.module.scss';

interface Props {}

const Header = observer((props: Props) => {
    const model = useFileTreeModel();
    const root = useDocument<'dir'>();
    const search = useFileTreeSearch(model);

    return (
        <div className={clsx(styles.header)}>
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
                    const path = model.getFocusedPath();
                    const focused = root.allItems.find((f) => f.filePath === path);
                    if (!focused) {
                        return;
                    }
                    const dir = focused.type === 'dir' ? focused : focused.parent;
                    if (!dir || dir.type !== 'dir') {
                        return;
                    }
                    const newDir = await (dir as Directory).createDir();
                    if (newDir) {
                        model.startRenaming(newDir.filePath);
                    }
                }}
            />
        </div>
    );
});

export default Header;
