import { mdiAccountArrowLeft } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useComputed } from '@tdev-hooks/useComputed';
import type StudentGroup from '@tdev-models/StudentGroup';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import sharedStyles from '../styles.module.scss';
import { _AddMembersPopupPropsInternal } from '../types';
import styles from './styles.module.scss';

interface ImportGroupRowProps {
    sourceGroup: StudentGroup;
    targetGroup: StudentGroup;
    onImported: _AddMembersPopupPropsInternal['onImported'];
}

const ImportGroupRow = observer(({ sourceGroup, targetGroup, onImported }: ImportGroupRowProps) => {
    const disabled = useComputed(
        () => sourceGroup.students.every((student) => targetGroup.userIds.has(student.id)),
        [sourceGroup, targetGroup]
    );

    const handleImport = () => {
        const studentsToImport = sourceGroup.students.filter(
            (student) => !targetGroup.userIds.has(student.id)
        );
        if (studentsToImport.length === 0) {
            return;
        }
        studentsToImport.forEach((student) => targetGroup.addStudent(student));
        onImported(
            studentsToImport.map((student) => student.id),
            sourceGroup
        );
    };

    return (
        <div className={clsx(styles.listItem, disabled && sharedStyles.disabled)} title={sourceGroup.name}>
            {sourceGroup.name}
            <div className={sharedStyles.actions}>
                <Button onClick={handleImport} disabled={disabled} icon={mdiAccountArrowLeft} color="green" />
            </div>
        </div>
    );
});

export default ImportGroupRow;
