import { mdiFilePlus } from '@mdi/js';
import { DocumentType } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import { useFileTreeModel } from '../../WithFileTreeModel';
import styles from './styles.module.scss';

interface Props {}

const NewItem = observer((props: Props) => {
    const documentStore = useStore('documentStore');
    const model = useFileTreeModel();
    const root = useDocument<'dir'>();
    const createableTypes = [...documentStore.fileExtensions.keys()] as DocumentType[];
    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiFilePlus} size={SIZE_S} noBorder color="grey" />
                </span>
            }
            on={['hover', 'click']}
            position={['bottom right', 'bottom center', 'bottom left']}
            arrow={false}
        >
            <Card classNames={{ body: clsx(styles.newItem) }}>
                {createableTypes.flatMap((type) => {
                    const _configs = documentStore.fileExtensions.get(type) ?? [];
                    const configs = Array.isArray(_configs) ? _configs : [_configs];
                    return configs.map((config) => {
                        return (
                            <Button
                                key={config.extension}
                                title={config.extension || type}
                                text={config.icon ? (undefined as any) : config?.extension || type}
                                icon={config.icon}
                                color={config.iconColor}
                                size={SIZE_S}
                                iconSide="left"
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
                                    const newFile = await (dir as Directory).createFile(
                                        type,
                                        `new-file${config.extension}`
                                    );
                                    if (newFile) {
                                        model.startRenaming(newFile.filePath);
                                    }
                                }}
                            />
                        );
                    });
                })}
            </Card>
        </Popup>
    );
});

export default NewItem;
