import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import ProgressState, { MetaInit } from '@tdev-models/documents/ProgressState';
import Icon from '@mdi/react';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { mdiChevronDown, mdiChevronUp, mdiCloseCircle } from '@mdi/js';
import IconButton from '@tdev-components/shared/Button/IconButton';
import { IfmColors } from '@tdev-components/shared/Colors';

interface Props extends MetaInit {
    item: React.ReactNode;
    doc: ProgressState;
    label: React.ReactNode;
    index: number;
}

const Item = observer((props: Props) => {
    const ref = React.useRef<HTMLDivElement>(null);
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

    const showContent = isActive || doc.openSteps.has(index);

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
            <div
                className={clsx(
                    styles.bullet,
                    animate && styles.animate,
                    index === doc.confirmProgressIndex && styles.confirming
                )}
                ref={ref}
            >
                <IconButton
                    path={path}
                    onHover={(hovered) => doc.setHoveredIndex(hovered ? index : undefined)}
                    onClick={() => doc.onStepClicked(index)}
                    disabled={index > doc.progress + 1}
                    color={color}
                    className={clsx(isLatest && !isActive && styles.activeStep)}
                    size={'var(--tdev-progress-bullet-size)'}
                />
                {index === doc.confirmProgressIndex && (
                    <IconButton
                        path={mdiCloseCircle}
                        onClick={(e) => {
                            doc.setConfirmProgressIndex();
                        }}
                        color={IfmColors.red}
                        size={'var(--tdev-progress-bullet-size)'}
                    />
                )}
            </div>
            <div className={clsx(styles.content)}>
                <div
                    className={clsx(
                        styles.label,
                        doc.togglableSteps.has(index) && styles.toggle,
                        showContent && styles.activeLabel
                    )}
                    onClick={() =>
                        doc.togglableSteps.has(index) && doc.setStepOpen(index, !doc.openSteps.has(index))
                    }
                >
                    <div>{label}</div>
                    {doc.togglableSteps.has(index) && (
                        <Icon
                            path={showContent ? mdiChevronUp : mdiChevronDown}
                            size={SIZE_M}
                            className={clsx(
                                styles.chevron,
                                showContent ? styles.up : styles.down,
                                isActive && styles.activeChevron
                            )}
                        />
                    )}
                </div>
                {showContent && item}
            </div>
        </li>
    );
});

export default Item;
