import Alert from '@tdev-components/shared/Alert';
import { useComputed } from '@tdev-hooks/useComputed';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type File from '../../../models/File';
import { type DuplicatedUuid, duplicatedUuids } from '../../uuid';
import styles from './styles.module.scss';

interface Props {
    file: File;
}

/**
 * Colors the duplicates red wherever uuids are marked (`.cms-uuid[data-uuid]`): in the text, in code
 * blocks and in the toolbars. A stylesheet reaches all of them without updating their decorations.
 * It only sets the variables of the marker (see `_uuid.scss`), so it does not compete with its rules.
 * The uuids match `uuidV4Regex`, so they are safe to use in a selector.
 */
const highlightRule = (duplicates: DuplicatedUuid[]) => {
    const selectors = duplicates.map(({ uuid }) => `.cms-uuid[data-uuid="${uuid}" i]`);
    return `${selectors.join(',\n')} {
        --cms-uuid-background: var(--ifm-color-danger-contrast-background);
        --cms-uuid-border: var(--ifm-color-danger-dark);
    }`;
};

/**
 * Warns about uuids occurring more than once in the file, e.g. the `id` of a copied component:
 * the components would share their stored data. Some pages repeat a uuid on purpose, so the alert
 * can be dismissed. It is shown again when the duplicates change.
 */
const DuplicateUuids = observer(({ file }: Props) => {
    const duplicates = useComputed(() => duplicatedUuids(file.content), [file]);
    const [dismissedUuids, setDismissedUuids] = React.useState<string | null>(null);
    if (duplicates.length === 0) {
        return null;
    }
    const uuids = duplicates.map(({ uuid }) => uuid).join(' ');

    return (
        <>
            <style>{highlightRule(duplicates)}</style>
            {dismissedUuids !== uuids && (
                <Alert
                    type="danger"
                    className={clsx(styles.alert)}
                    onDiscard={() => setDismissedUuids(uuids)}
                >
                    <strong>Mehrfach verwendete UUIDs:</strong> Komponenten mit derselben UUID teilen sich
                    ihre gespeicherten Daten. Falls das nicht beabsichtigt ist, ersetze die rot markierten
                    UUIDs mit einer neuen.
                    <ul className={clsx(styles.list)}>
                        {duplicates.map(({ uuid, count }) => (
                            <li key={uuid}>
                                <code>{uuid}</code> ({count}×)
                            </li>
                        ))}
                    </ul>
                </Alert>
            )}
        </>
    );
});

export default DuplicateUuids;
