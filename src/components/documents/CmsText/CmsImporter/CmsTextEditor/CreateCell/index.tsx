import { mdiLoading, mdiPlus } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useStore } from '@tdev-hooks/useStore';
import { createCmsText } from '@tdev-models/documents/CmsText';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

interface Props {
    documentRootId: string;
    userId: string;
}

const CreateCell = (props: Props) => {
    const documentStore = useStore('documentStore');
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreate = () => {
        setIsCreating(true);
        createCmsText(documentStore, props.documentRootId, props.userId, '').finally(() => {
            setIsCreating(false);
        });
    };

    return (
        <td className={clsx(styles.cell)}>
            <Button
                icon={isCreating ? mdiLoading : mdiPlus}
                title="CMS Text erstellen"
                color="blue"
                size={SIZE_S}
                onClick={handleCreate}
                disabled={isCreating}
                spin={isCreating}
            />
        </td>
    );
};

export default CreateCell;
