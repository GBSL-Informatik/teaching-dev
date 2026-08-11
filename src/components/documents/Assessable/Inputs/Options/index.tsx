import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { AssessableType } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import { mdiCollapseAll, mdiExpandAll } from '@mdi/js';

const Options = observer(({ children }: { children: React.ReactNode }) => {
    const doc = useDocument<AssessableType>();
    return (
        <div className={clsx(styles.optionsBlock)}>
            <div className={styles.optionsContainer}>{children}</div>
            {doc.canCollapseOptions && (
                <>
                    <Button
                        icon={doc.showAllOptions ? mdiCollapseAll : mdiExpandAll}
                        onClick={() => doc.setShowAllOptions(!doc.showAllOptions)}
                        className={styles.btnExpandCollapseOptions}
                        color={doc.showAllOptions ? 'red' : 'primary'}
                        title={doc.showAllOptions ? 'Alle Optionen einklappen' : 'Alle Optionen ausklappen'}
                    />
                </>
            )}
        </div>
    );
});

export default Options;
