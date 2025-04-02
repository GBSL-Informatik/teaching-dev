import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { default as DirModel } from '@tdev-models/cms/Dir';
import File from '../File';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import AddFilePopup from '../File/AddOrUpdateFile/AddFilePopup';
import iFile from '@tdev-models/cms/iFile';
import PreviewPopup from '../File/FilePreview/PreviewPopup';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props<T extends iFile = iFile> {
    dir: DirModel;
    showActions?: 'always' | 'hover' | 'never';
    filter?: (entry: iFile) => entry is T;
    useLocalMode?: boolean;
    // Works only for local mode!
    // used to display the root folder as open
    expandedOnLoad?: boolean;
    /**
     * Works only for local mode!
     * When a value of expandedByDefault matches with a folder name,
     * the folder will be displayed as open, no matter it's location
     */
    expandedByDefault?: string[];
    hideEmpty?: boolean;
    skipLoadOnHover?: boolean;
    onSelect?: (file: T) => void;
}

const Dir = observer((props: Props) => {
    const { dir, filter, useLocalMode, expandedByDefault } = props;
    const [isOpen, setOpen] = React.useState(!!props.expandedOnLoad);
    React.useEffect(() => {
        if (expandedByDefault && expandedByDefault.includes(dir.name)) {
            setOpen(true);
            if (!dir.isFetched) {
                dir.fetchDirectory();
            }
        }
    }, [dir, expandedByDefault]);
    const onHover = React.useMemo((): React.MouseEventHandler<HTMLDivElement> | undefined => {
        if (props.skipLoadOnHover || dir.isFetched) {
            return undefined;
        }
        return (e) => {
            dir.fetchDirectory();
        };
    }, [props.skipLoadOnHover, dir.isFetched]);

    return (
        <li className={clsx(shared.item, styles.dir)}>
            <div className={clsx(styles.dirName)} onMouseEnter={onHover}>
                <span
                    className={clsx(styles.dir)}
                    onClick={() => {
                        if (useLocalMode) {
                            if (isOpen) {
                                setOpen(false);
                            } else {
                                setOpen(true);
                                if (!dir.isFetched) {
                                    dir.fetchDirectory();
                                }
                            }
                        } else {
                            dir.setOpen(!dir.isOpen);
                        }
                    }}
                >
                    <Icon
                        spin={dir.isSyncing}
                        path={useLocalMode ? (isOpen ? dir.iconOpen : dir.iconClosed) : dir.icon}
                        size={0.8}
                        color={dir.iconColor}
                    />
                    {dir.hasIndexFile ? (
                        <PreviewPopup file={dir.indexFile!} inlineTrigger>
                            <span className={clsx(shared.item)}>{dir.name}</span>
                        </PreviewPopup>
                    ) : (
                        <>{dir.name}</>
                    )}
                </span>
                {props.showActions !== 'never' && (
                    <AddFilePopup
                        dir={dir}
                        className={clsx(props.showActions === 'hover' && styles.onHover)}
                    />
                )}
            </div>
            {(useLocalMode ? isOpen : dir.isOpen) && dir.children.length > 0 && (
                <ul>
                    {dir.children.map((child, idx) => {
                        if (child.type === 'dir') {
                            if (props.hideEmpty && filter && child.isFetched) {
                                if (!child.children.find((item) => item.type === 'dir' || filter(item))) {
                                    return null;
                                }
                            }
                            return (
                                <Dir
                                    key={idx}
                                    dir={child}
                                    showActions={props.showActions}
                                    useLocalMode={useLocalMode}
                                    filter={filter}
                                    expandedByDefault={expandedByDefault || []}
                                    onSelect={props.onSelect}
                                />
                            );
                        }
                        if (!filter || filter(child)) {
                            return (
                                <File
                                    key={idx}
                                    file={child}
                                    showActions={props.showActions}
                                    onSelect={props.onSelect}
                                />
                            );
                        }
                        return null;
                    })}
                </ul>
            )}
        </li>
    );
});
export default Dir;
