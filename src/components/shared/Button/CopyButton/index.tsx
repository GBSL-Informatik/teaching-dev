import clsx from 'clsx';
import React from 'react';
import Button from '..';
import { mdiCheck, mdiContentCopy } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

const useCopyButton = (value: string | undefined) => {
    const [isCopied, setIsCopied] = React.useState(false);
    const copyTimeout = React.useRef<number | undefined>(undefined);

    const copyText = React.useCallback(() => {
        navigator.clipboard.writeText(value ?? '').then(() => {
            setIsCopied(true);
            copyTimeout.current = window.setTimeout(() => {
                setIsCopied(false);
            }, 1000);
        });
    }, [value]);

    React.useEffect(() => () => window.clearTimeout(copyTimeout.current), []);

    return { copyText, isCopied };
};

interface Props {
    className?: string;
    value?: string;
    title?: string;
    size?: number;
    text?: string;
}

export default function CopyButton(props: Props): React.ReactNode {
    const { className, value, title } = props;
    const { copyText, isCopied } = useCopyButton(value);

    return (
        <Button
            title={title}
            className={clsx(className)}
            onClick={copyText}
            icon={isCopied ? mdiCheck : mdiContentCopy}
            color={isCopied ? 'green' : undefined}
            size={props.size ?? SIZE_S}
            text={props.text as string}
        />
    );
}
