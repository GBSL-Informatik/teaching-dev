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
import TextInput from '@tdev-components/shared/TextInput';
import DefinitionList from '@tdev-components/DefinitionList';
import Badge from '@tdev-components/shared/Badge';

const StudentGroupPanel = observer(() => {
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
    const viewStore = useStore('viewStore');
    const adminView = viewStore.adminView;
    const current = userStore.current;

    if (!current?.hasElevatedAccess) {
        return null;
    }
    const presentableGroups = groupStore.managedStudentGroups.filter((g) => g.canPresent);
    return (
        <div>
            <div className={clsx(styles.controls)}>
                <Button
                    onClick={() => {
                        adminView.setGroupSearchFilter();
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
                        <TextInput
                            placeholder="Lerngruppen filtern..."
                            value={adminView.groupSearchFilter}
                            onChange={(val) => {
                                adminView.setGroupSearchFilter(val);
                            }}
                        />
                        <div
                            className={clsx(styles.btnResetContainer, {
                                [styles.hidden]: !adminView.groupSearchFilter
                            })}
                        >
                            <Button
                                onClick={() => {
                                    adminView.setGroupSearchFilter();
                                }}
                                icon={mdiCloseCircleOutline}
                                size={0.8}
                                noBorder
                                color="secondary"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className={clsx(styles.streamableGroups)}>
                <DefinitionList>
                    <dt>Präsentationsberechtigte Gruppen</dt>
                    <dd>
                        <Badge color={presentableGroups.length > 0 ? 'red' : 'lightBlue'}>
                            {presentableGroups.length} Gruppen
                        </Badge>
                    </dd>
                    <dd>
                        <i>
                            Während Prüfungen sollten diese Berechtigungen deaktiviert werden, da sonst
                            potenziell sensible Informationen ausgetauscht werden können.
                        </i>
                    </dd>
                    <dt>Aktionen</dt>
                    <dd>
                        <Button
                            onClick={() => {
                                presentableGroups.forEach((g) => g.setCanPresent(false));
                            }}
                            icon={mdiRestore}
                            iconSide="left"
                            color="secondary"
                            text="Alle Berechtigungen deaktivieren"
                        />
                    </dd>
                </DefinitionList>
            </div>
            <div className={clsx(styles.studentGroups)}>
                {adminView.filteredStudentGroups.map((match) => (
                    <StudentGroup
                        key={match.group.id}
                        studentGroup={match.group}
                        className={clsx(styles.studentGroup)}
                    />
                ))}
            </div>
        </div>
    );
});

export default StudentGroupPanel;
