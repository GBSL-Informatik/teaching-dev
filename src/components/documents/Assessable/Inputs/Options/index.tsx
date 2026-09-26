import { mdiCollapseAll, mdiExpandAll } from '@mdi/js';
import { AssessableType } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import { useDocument } from '@tdev-hooks/useContextDocument';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from '../styles.module.scss';

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
