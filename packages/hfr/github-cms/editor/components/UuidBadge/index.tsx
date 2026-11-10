import { mdiRefresh } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface Props {
    /** e.g. the attribute holding the uuid */
    name: string;
    /** not set while the attribute has no uuid, e.g. `id=""` */
    uuid?: string;
    onRegenerate: () => void;
}

/**
 * A uuid in the toolbar of a node (shortened), with a button to replace it with a new one,
 * or to insert one when the attribute has no uuid yet.
 */
const UuidBadge = ({ name, uuid, onRegenerate }: Props) => {
    return (
        <span className={clsx(styles.uuid, 'cms-uuid')} title={uuid ?? 'keine UUID'}>
            {name}: {uuid ? `${uuid.slice(0, 8)}…` : <span className={clsx(styles.missing)}>keine UUID</span>}
            <Button
                icon={mdiRefresh}
                size={SIZE_XS}
                title={uuid ? 'Neue UUID generieren' : 'UUID einfügen'}
                onClick={onRegenerate}
            />
        </span>
    );
};

export default UuidBadge;
