import { mdiRefresh } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface Props {
    /** e.g. the attribute holding the uuid */
    name: string;
    uuid: string;
    onRegenerate: () => void;
}

/**
 * A uuid in the toolbar of a node (shortened), with a button to replace it with a new one.
 */
const UuidBadge = ({ name, uuid, onRegenerate }: Props) => {
    return (
        <span className={clsx(styles.uuid, 'cms-uuid')} title={uuid}>
            {name}: {uuid.slice(0, 8)}…
            <Button icon={mdiRefresh} size={SIZE_XS} title="Neue UUID generieren" onClick={onRegenerate} />
        </span>
    );
};

export default UuidBadge;
