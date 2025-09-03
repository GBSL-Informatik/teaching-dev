import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiMagnify, mdiPlusCircleOutline, mdiRestore } from '@mdi/js';
import StudentGroup from '@tdev-components/StudentGroup';
import _ from 'es-toolkit/compat';
import { action } from 'mobx';
import Icon from '@mdi/react';

const StudentGroupPanel = observer(() => {
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
    const current = userStore.current;
    const [searchFilter, setSearchFilter] = React.useState('');
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(searchFilter, 'i'));

    React.useEffect(() => {
        setSearchRegex(new RegExp(searchFilter, 'i'));
    }, [searchFilter]);

    if (!current?.hasElevatedAccess) {
        return null;
    }
    return (
        <div>
            <div className={clsx(styles.controls)}>
                <Button
                    onClick={() => {
                        groupStore.create('', '').then(
                            action((group) => {
                                group?.setEditing(true);
                            })
                        );
                    }}
                    icon={mdiPlusCircleOutline}
                    color="primary"
                    text="Neue Lerngruppe erstellen"
                />
                <div className={clsx(styles.searchBox)}>
                    <Icon path={mdiMagnify} size={1} />
                    <div className={clsx(styles.searchInput)}>
                        <input
                            type="text"
                            placeholder="Lerngruppen filtern..."
                            value={searchFilter}
                            className={clsx(styles.textInput)}
                            onChange={(e) => {
                                setSearchFilter(e.target.value);
                            }}
                        />
                        <Button
                            onClick={() => {
                                setSearchFilter('');
                            }}
                            icon={mdiRestore}
                            size={0.8}
                            noBorder
                            color="secondary"
                        />
                    </div>
                </div>
            </div>
            <div className={clsx(styles.studentGroups)}>
                {_.orderBy(
                    groupStore.managedStudentGroups
                        .filter((g) => !g.parentId)
                        .filter((user) => searchRegex.test(user.searchTerm)),
                    ['_pristine.name', 'createdAt'],
                    ['asc', 'desc']
                ).map((group) => (
                    <StudentGroup key={group.id} studentGroup={group} className={clsx(styles.studentGroup)} />
                ))}
            </div>
        </div>
    );
});

export default StudentGroupPanel;
