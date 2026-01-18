import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';

interface Props<T extends CodeType> {
    script: iCode<T>;
    children: React.ReactNode;
    ignoreSlim?: boolean;
}

const Container = observer(<T extends CodeType>(props: Props<T>) => {
    const { script } = props;
    const notifyUnpersisted = script.root?.isDummy && !script.meta.slim && !script.meta.hideWarning;
    return (
        <div
            className={clsx(
                styles.controls,
                script.meta.slim && styles.slim,
                notifyUnpersisted && styles.unpersisted
            )}
        >
            {(!script.meta.slim || props.ignoreSlim) && props.children}
        </div>
    );
});

export default Container;
