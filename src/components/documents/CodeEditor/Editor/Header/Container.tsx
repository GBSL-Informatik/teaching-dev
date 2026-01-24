import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';

interface Props<T extends CodeType> {
    code: iCode<T>;
    children: React.ReactNode;
    ignoreSlim?: boolean;
    onRequestFullscreen?: () => void;
}

const Container = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const notifyUnpersisted = code.root?.isDummy && !code.meta.slim && !code.meta.hideWarning;
    return (
        <div
            className={clsx(
                styles.controls,
                code.meta.slim && styles.slim,
                notifyUnpersisted && styles.unpersisted
            )}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onRequestFullscreen?.();
            }}
        >
            {(!code.meta.slim || props.ignoreSlim) && props.children}
        </div>
    );
});

export default Container;
