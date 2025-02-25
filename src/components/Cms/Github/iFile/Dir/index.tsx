import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { default as DirModel } from '@tdev-models/cms/Dir';
import File from '../File';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import AddFilePopup from '../File/AddOrUpdateFile/AddFilePopup';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    dir: DirModel;
    showActions?: 'always' | 'hover';
}

const Dir = observer((props: Props) => {
    const { dir } = props;
    const cmsStore = useStore('cmsStore');
    return (
        <li className={clsx(shared.item)}>
            <div className={clsx(styles.dirName)}>
                <span
                    className={clsx(styles.dir)}
                    onClick={() => {
                        dir.setOpen(!dir.isOpen);
                        // cmsStore.setActiveEntry(dir);
                    }}
                >
                    <Icon spin={dir.isSyncing} path={dir.icon} size={0.8} color={dir.iconColor} />
                    {dir.name}
                </span>
                <AddFilePopup dir={dir} className={clsx(props.showActions === 'hover' && styles.onHover)} />
            </div>
            {dir.isOpen && dir.children.length > 0 && (
                <ul>
                    {dir.children.map((child, idx) => {
                        return (
                            <React.Fragment key={idx}>
                                {child.type === 'dir' ? (
                                    <Dir dir={child} showActions={props.showActions} />
                                ) : (
                                    <File file={child} showActions={props.showActions} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </ul>
            )}
        </li>
    );
});
export default Dir;
