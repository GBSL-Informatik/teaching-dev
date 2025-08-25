import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { MetaInit } from '@tdev-models/documents/ProgressState';
import Icon from '@mdi/react';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { mdiChevronDown, mdiChevronUp, mdiCloseCircle } from '@mdi/js';
import IconButton from '@tdev-components/shared/Button/IconButton';
import { IfmColors } from '@tdev-components/shared/Colors';
import Step from '@tdev-models/documents/ProgressState/Step';

interface Props extends MetaInit {
    item: React.ReactNode;
    step: Step;
    label: React.ReactNode;
}

const Item = observer((props: Props) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const { item, label, step } = props;
    const [animate, setAnimate] = React.useState(false);
    React.useEffect(() => {
        if (ref.current && step.isScrollingTo) {
            ref.current.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'start' });
            step.progressState.setScrollTo(false);
            setAnimate(true);
        }
    }, [ref, step.isScrollingTo]);

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
                styles[step.state],
                (step.isActive || step.isLatest || step.isHovered) && styles.active,
                step.isActive && !step.isLatest && styles.alreadyDone,
                !step.isActive && step.isLatest && styles.inactiveLatest
            )}
        >
            <div
                className={clsx(
                    styles.bullet,
                    animate && styles.animate,
                    step.isConfirmed && styles.confirming
                )}
                ref={ref}
            >
                <IconButton
                    path={step.iconState.path}
                    onHover={(hovered) => step.setHovered(hovered)}
                    onClick={() => step.onClicked()}
                    disabled={step.isDisabled}
                    color={step.iconState.color}
                    className={clsx(step.isLatest && !step.isActive && styles.activeStep)}
                    size={'var(--tdev-progress-bullet-size)'}
                />
                {step.isConfirmed && (
                    <IconButton
                        path={mdiCloseCircle}
                        onClick={(e) => {
                            step.setConfirmed(false);
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
                        step.canToggleContent && styles.toggle,
                        step.showContent && styles.activeLabel
                    )}
                    onClick={() => step.canToggleContent && step.setOpen(!step.isOpen)}
                >
                    <div>{label}</div>
                    {step.canToggleContent && (
                        <Icon
                            path={step.showContent ? mdiChevronUp : mdiChevronDown}
                            size={SIZE_M}
                            className={clsx(
                                styles.chevron,
                                step.showContent ? styles.up : styles.down,
                                step.isActive && styles.activeChevron
                            )}
                        />
                    )}
                </div>
                {step.showContent && item}
            </div>
        </li>
    );
});

export default Item;
