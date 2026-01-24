import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiCardRemoveOutline } from '@mdi/js';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import CopyButton from '@tdev-components/shared/Button/CopyButton';

export type LogMessage = { type: 'log' | 'error'; message: string };

interface Props {
    messages: LogMessage[];
    onClear: () => void;
    maxLines?: number;
}
// make it scroll always to bottom - add a ref to the messages container and useEffect to scroll
const Logs = observer((props: Props) => {
    const { messages, onClear, maxLines = 40 } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    const [hasHorizontalOverflow, setHasHorizontalOverflow] = React.useState(false);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
            setHasHorizontalOverflow(ref.current.scrollWidth > ref.current.clientWidth);
        }
    }, [messages]);
    return (
        <div className={clsx(styles.logs)}>
            <div className={clsx(styles.actions)}>
                <div className={clsx(styles.hoverActions)}>
                    <CopyButton
                        size={SIZE_S}
                        value={messages.map((msg) => msg.message).join('\n')}
                        title="Kopieren"
                        className={clsx(styles.button)}
                    />
                    <Button
                        title="Logs leeren"
                        onClick={onClear}
                        icon={mdiCardRemoveOutline}
                        size={SIZE_S}
                        className={clsx(styles.button)}
                    />
                </div>
            </div>
            <div className={clsx(styles.messages)} style={{ maxHeight: maxLines * 1.2 + 2 + 'em' }} ref={ref}>
                {messages.map((msg, idx) => (
                    <pre key={idx} className={clsx(styles.message, styles[msg.type])}>
                        {msg.message}
                    </pre>
                ))}
                {hasHorizontalOverflow && (
                    <div className={clsx(styles.message, styles.scrollMargin)}>
                        <br />
                    </div>
                )}
            </div>
        </div>
    );
});

export default Logs;
