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
    const ref = React.useRef<HTMLButtonElement>(null);
    const { item, index, label, doc } = props;
    const [animate, setAnimate] = React.useState(false);

    const isLatest = index === doc.progress;
    const isActive = index === doc.viewedIndex;
    const { path, color, state } = doc.iconStateForIndex(index);

    React.useEffect(() => {
        if (ref.current && doc.scrollTo && isActive) {
            ref.current.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'start' });
            doc.setScrollTo(false);
            setAnimate(true);
        }
    }, [ref, doc.scrollTo, isActive]);

    React.useEffect(() => {
        if (animate) {
            const timeout = setTimeout(() => {
                setAnimate(false);
            }, 2000);
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [animate]);

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
                ref={ref}
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
                className={clsx(styles.progressButton, animate && styles.animate)}
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
