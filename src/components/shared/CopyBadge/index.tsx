import { mdiCircle, mdiClipboardCheck, mdiClipboardText, mdiCloseCircle, mdiLoading } from '@mdi/js';
import Icon, { Stack } from '@mdi/react';
import { CopyState, useCopyState } from '@tdev-hooks/useCopyState';
import clsx from 'clsx';
import { Color, getType } from '../Badge';
import styles from './styles.module.scss';

const CopyIcon: { [key in CopyState]: string } = {
    none: mdiClipboardText,
    copied: mdiClipboardCheck,
    error: mdiCloseCircle,
    spin: mdiLoading
};
const CopyColor: { [key in CopyState]: string | undefined } = {
    none: 'var(--ifm-color-primary)',
    error: 'var(--ifm-color-danger)',
    copied: 'var(--ifm-color-success)',
    spin: undefined
};
interface Props {
    value: string;
    label?: string;
    size?: number;
    className?: string;
    color?: Color;
    title?: string;
}

const CopyBadge = (props: Props) => {
    const { copyState, copy } = useCopyState();

    return (
        <span
            className={clsx(
                styles.copyBadge,
                props.className,
                'badge',
                `badge--${getType(props.color) || 'secondary'}`
            )}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copy(() => navigator.clipboard.writeText(props.value));
            }}
            title={props.title ?? `Copy ${props.value}`}
        >
            {props.label || props.value}
            <span className={clsx(styles.copyIcon)}>
                <Stack size={props.size || 0.7} color={null}>
                    <Icon path={mdiCircle} size={props.size || 0.75} color={'var(--ifm-color-secondary)'} />
                    <Icon path={CopyIcon[copyState]} size={props.size || 0.6} color={CopyColor[copyState]} />
                </Stack>
            </span>
        </span>
    );
};

export default CopyBadge;
