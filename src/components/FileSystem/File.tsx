import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

export type FileType = string;

interface Props {
    file: FileType;
    active?: boolean;
    onSelect?: (name: string) => void;
    noSelect?: boolean;
}

const File = observer((props: Props) => {
    const { file, active } = props;
    return (
        <li className={clsx(styles.file, styles.item)}>
            <span
                onClick={() => {
                    if (props.noSelect) {
                        return;
                    }
                    props.onSelect?.(file);
                }}
                className={clsx(styles.fileLink, styles.name, active && styles.active)}
            >
                {file}
            </span>
        </li>
    );
});
export default File;
