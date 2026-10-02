import { mdiFolderPlus, mdiMagnify } from '@mdi/js';
import { useFileTreeSearch } from '@pierre/trees/react';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useFileTreeModel } from '../WithFileTreeModel';
import NewItem from './NewItem';
import styles from './styles.module.scss';

interface Props {}

const Header = observer((props: Props) => {
    const model = useFileTreeModel();
    const root = useDocument<'dir'>();
    const search = useFileTreeSearch(model);
    const documentStore = useStore('documentStore');

    return (
        <div className={clsx(styles.header)}>
            <Button
                icon={mdiMagnify}
                size={SIZE_S}
                noBorder
                color={search.isOpen ? 'primary' : undefined}
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
            <Button
                icon={mdiFolderPlus}
                size={SIZE_S}
                noBorder
                color={undefined}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
                onClick={async () => {
                    const path = model.getFocusedPath();
                    const focused = root.allFiles.find((f) => f.filePath === path);
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
            <NewItem />
        </div>
    );
});

export default Header;
