import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import ProgressState, { MetaInit } from '@tdev-models/documents/ProgressState';
import { action } from 'mobx';
import Icon from '@mdi/react';
import { SIZE_M } from '@tdev-components/shared/iconSizes';

interface Props extends MetaInit {
    item: React.ReactNode;
    doc: ProgressState;
    label: React.ReactNode;
    index: number;
}

const Item = observer((props: Props) => {
    const { item, index, label, doc } = props;
    const isLatest = index === doc.progress;
    const isActive = index === doc.viewedIndex;
    const { path, color, state } = doc.iconStateForIndex(index);

    return (
        <li
            className={clsx(
                styles.item,
                styles[state],
                (isActive || isLatest || doc.hoveredIndex === index) && styles.active,
                isActive && !isLatest && styles.alreadyDone,
                !isActive && isLatest && styles.inactiveLatest
            )}
        >
            <button
                role="button"
                type="button"
                onMouseOver={() => {
                    if (index > doc.progress + 1) {
                        return;
                    }
                    doc.setHoveredIndex(index);
                }}
                onMouseOut={() => {
                    doc.setHoveredIndex(undefined);
                }}
                onClick={action(() => {
                    doc.onStepClicked(index);
                })}
                disabled={index > doc.progress + 1}
                className={clsx(styles.progressButton)}
            >
                <Icon
                    path={path}
                    size={SIZE_M}
                    color={color}
                    className={styles.icon}
                    title={`Schritt ${index + 1}`}
                />
            </button>
            <div>
                {isActive ? (
                    <>
                        <b>{label}</b>
                        <br />
                        {item}
                    </>
                ) : (
                    label
                )}
            </div>
        </li>
    );
});

export default Item;
