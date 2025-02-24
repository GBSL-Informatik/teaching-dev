import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import Badge from '@tdev-components/shared/Badge';

interface Props {
    className?: string;
    attributes: Record<string, string>;
    skippedAttributes?: string[];
    copyableAttributes?: string[];
    colors?: Record<string, string>;
    labels?: Record<string, string>;
}

const MyAttributes = observer((props: Props) => {
    const colors = props.colors || {};
    const labels = props.labels || {};
    const skipped = React.useMemo(() => new Set(props.skippedAttributes), [props.skippedAttributes]);
    const copyable = React.useMemo(() => new Set(props.copyableAttributes), [props.copyableAttributes]);

    return (
        <div className={clsx(styles.attributes, props.className)}>
            {Object.entries(props.attributes).map(([key, value], idx) => {
                if (skipped.has(key)) {
                    return null;
                }
                if (copyable.has(key)) {
                    return <CopyBadge key={idx} label={key} value={value} />;
                }
                return (
                    <Badge key={idx} color={colors[key] || 'lightBlue'} title={value}>
                        {labels[key] || key}
                    </Badge>
                );
            })}
        </div>
    );
});

export default MyAttributes;
