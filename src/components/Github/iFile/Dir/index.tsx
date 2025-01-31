import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { default as DirModel } from '@tdev-models/cms/Dir';
import File from '../File';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import AddFilePopup from '../File/AddOrUpdateFile/AddFilePopup';

interface Props {
    dir: DirModel;
}

const Dir = observer((props: Props) => {
    const { dir } = props;
    return (
        <li className={clsx(shared.item)}>
            <div className={clsx(styles.dirName)}>
                <span
                    className={clsx(styles.dir)}
                    onClick={() => {
                        dir.setOpen(!dir.isOpen);
                    }}
                >
                    <Icon spin={dir.isSyncing} path={dir.icon} size={0.8} color={dir.iconColor} />
                    {dir.name}
                </span>
                <AddFilePopup dir={dir} />
            </div>
            {dir.isOpen && dir.children.length > 0 && (
                <ul>
                    {dir.children.map((child, idx) => {
                        return (
                            <React.Fragment key={idx}>
                                {child.type === 'dir' ? <Dir dir={child} /> : <File file={child} />}
                            </React.Fragment>
                        );
                    })}
                </ul>
            )}
        </li>
    );
});
export default Dir;
