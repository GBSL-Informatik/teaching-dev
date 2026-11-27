import { mdiCheck, mdiContentCopy } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useCopyState } from '@tdev-hooks/useCopyState';
import clsx from 'clsx';
import React from 'react';
import Button from '..';

interface Props {
    className?: string;
    value?: string;
    title?: string;
    size?: number;
    text?: string;
}

export default function CopyButton(props: Props): React.ReactNode {
    const { className, value, title } = props;
    const { copyState, copy } = useCopyState(1000);
    const isCopied = copyState === 'copied';
    const handleClick = React.useCallback(() => {
        copy(() => navigator.clipboard.writeText(value ?? ''));
    }, [copy, value]);

    return (
        <Button
            title={title}
            className={clsx(className)}
            onClick={handleClick}
            icon={isCopied ? mdiCheck : mdiContentCopy}
            color={isCopied ? 'green' : undefined}
            size={props.size ?? SIZE_S}
            text={props.text as string}
        />
    );
}
