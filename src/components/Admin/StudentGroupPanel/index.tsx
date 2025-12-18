import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiCloseCircleOutline, mdiMagnify, mdiPlusCircleOutline, mdiRestore } from '@mdi/js';
import StudentGroup from '@tdev-components/StudentGroup';
import _ from 'es-toolkit/compat';
import { action } from 'mobx';
import Icon from '@mdi/react';

const StudentGroupPanel = observer(() => {
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
    const current = userStore.current;
    const [searchFilter, setSearchFilter] = React.useState('');

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
                            icon={mdiCloseCircleOutline}
                            size={0.8}
                            noBorder
                            color="secondary"
                        />
                    </div>
                </div>
            </div>
            <div className={clsx(styles.studentGroups)}>
                {(() => {
                    let searchRegex;
                    try {
                        searchRegex = new RegExp(searchFilter, 'i');
                    } catch {
                        searchRegex = null;
                    }

                    const matches = groupStore.managedStudentGroups
                        .filter((g) => !g.parentId)
                        .map((group) => {
                            let matchPriority = 0;

                            if (searchRegex) {
                                // Group name, student name or student email starts with the search filter?
                                const startsWithMatch =
                                    group.name.toLowerCase().startsWith(searchFilter.toLowerCase()) ||
                                    group.students?.some(
                                        (s) =>
                                            s.name.toLowerCase().startsWith(searchFilter.toLowerCase()) ||
                                            s.email.toLowerCase().startsWith(searchFilter.toLowerCase())
                                    );

                                // Group name matches (RegExp)?
                                const groupNameMatch = searchRegex.test(group.name);

                                // Student name or email matches (RegExp)?
                                const studentMatch = group.students?.some(
                                    (s) => searchRegex.test(s.name) || searchRegex.test(s.email)
                                );

                                // Description matches (RegExp)?
                                const descriptionMatch = searchRegex.test(group.description ?? '');

                                if (startsWithMatch) {
                                    matchPriority = 0;
                                } else if (studentMatch) {
                                    matchPriority = 1;
                                } else if (groupNameMatch) {
                                    matchPriority = 2;
                                } else if (descriptionMatch) {
                                    matchPriority = 3;
                                } else {
                                    // We have a search filter and this doesn't match it.
                                    return null;
                                }
                            }

                            return {
                                group: group,
                                matchPriority
                            };
                        })
                        .filter((group) => !!group); // Non-matched groups are null - filter them out.

                    return _.orderBy(
                        matches,
                        ['matchPriority', '_pristine.name', 'createdAt'],
                        ['asc', 'asc', 'desc']
                    ).map((match) => (
                        <StudentGroup
                            key={match.group.id}
                            studentGroup={match.group}
                            className={clsx(styles.studentGroup)}
                        />
                    ));
                })()}
            </div>
        </div>
    );
});

export default StudentGroupPanel;
