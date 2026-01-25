import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as StudentGroupModel } from '@tdev-models/StudentGroup';
import Button from '@tdev-components/shared/Button';
import {
    mdiAccountCancel,
    mdiAccountKey,
    mdiAccountKeyOutline,
    mdiAccountRemoveOutline,
    mdiCircleEditOutline,
    mdiClose,
    mdiCloseBox,
    mdiCloseCircleOutline,
    mdiContentSave,
    mdiDownloadLockOutline,
    mdiFileExcelOutline,
    mdiFormTextboxPassword,
    mdiLanguageHtml5,
    mdiTrashCanOutline
} from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import DefinitionList from '../DefinitionList';
import Details from '@theme/Details';
import { exportAsExcelSpreadsheet } from '@tdev-components/StudentGroup/services/excelExport';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Undo from './Undo';
import AddUserPopup from './AddMembersPopup';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import { exportNameCards } from './services/exportNameCards';
import AssignCredentials from './AssignCredentials';
import Card from '@tdev-components/shared/Card';
import Popup from 'reactjs-popup';
import { exportNewPasswordList } from './services/excelNewPwExport';

interface Props {
    studentGroup: StudentGroupModel;
    className?: string;
}

const StudentGroup = observer((props: Props) => {
    const [removedIds, setRemovedIds] = React.useState<string[]>([]);
    const [bulkRemovedIds, setBulkRemovedIds] = React.useState<string[]>([]);
    const [imported, setImported] = React.useState<{
        ids: string[];
        fromGroups: StudentGroupModel[] | undefined;
    }>();
    const [spinState, setSpinState] = React.useState<'unlinking' | null>(null);
    const adminStore = useStore('adminStore');
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
    const group = props.studentGroup;
    const isAdmin = group.isGroupAdmin;
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setRemovedIds([]);
        }, 5000);
        return () => clearTimeout(timeout);
    }, [removedIds]);
    return (
        <div className={clsx(styles.studentGroup, props.className, 'card')}>
            <div className={clsx('card__header', styles.header)}>
                <h3>
                    {isAdmin && group.isEditing ? (
                        <input
                            type="text"
                            placeholder="Titel..."
                            value={group.name}
                            className={clsx(styles.textInput)}
                            onChange={(e) => {
                                group.setName(e.target.value);
                            }}
                            autoFocus
                            tabIndex={1}
                            onFocus={(inp) => {
                                inp.target.select();
                            }}
                        />
                    ) : (
                        group.name || '-'
                    )}
                </h3>
                {isAdmin && (
                    <div className={styles.buttons}>
                        <div>
                            {group.isEditing ? (
                                <>
                                    <Button
                                        onClick={() => {
                                            group.reset();
                                            group.setEditing(false);
                                        }}
                                        icon={mdiCloseCircleOutline}
                                        color="black"
                                        title="Verwerfen"
                                    />
                                    <Button
                                        onClick={() => {
                                            group.save();
                                            group.setEditing(false);
                                        }}
                                        icon={mdiContentSave}
                                        color="green"
                                        title="Speichern"
                                    />
                                    <Confirm
                                        onConfirm={() => {
                                            groupStore.destroy(group);
                                        }}
                                        icon={mdiTrashCanOutline}
                                        color="red"
                                        title="Löschen"
                                        confirmText="Wirklich löschen?"
                                    />
                                </>
                            ) : (
                                <Button
                                    onClick={() => {
                                        group.setEditing(true);
                                    }}
                                    icon={mdiCircleEditOutline}
                                    color="orange"
                                    title="Bearbeiten"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className={clsx('card__body')}>
                <DefinitionList>
                    <dt>Beschreibung</dt>
                    <dd>
                        {isAdmin && group.isEditing ? (
                            <textarea
                                placeholder="Beschreibung..."
                                value={group.description}
                                className={clsx(styles.textarea)}
                                onChange={(e) => {
                                    group.setDescription(e.target.value);
                                }}
                                tabIndex={2}
                            />
                        ) : (
                            group.description || '-'
                        )}
                    </dd>
                    {isAdmin && (
                        <>
                            <dt>Export</dt>
                            <dd>
                                <div className={clsx(styles.exportButtons)}>
                                    <Button
                                        icon={mdiFileExcelOutline}
                                        onClick={() => exportAsExcelSpreadsheet(group)}
                                        color="green"
                                        text="Excel"
                                        size={SIZE_S}
                                        iconSide="left"
                                    />
                                    <Button
                                        color="primary"
                                        icon={mdiLanguageHtml5}
                                        iconSide="left"
                                        text="Namenskarten"
                                        size={SIZE_S}
                                        title="Namenskarten für A4 (4x gefaltet) herunterladen"
                                        onClick={() => {
                                            exportNameCards(group.students);
                                        }}
                                    />
                                </div>
                            </dd>
                            <dt>Aktionen</dt>
                            <dd>
                                <Button
                                    icon={mdiDownloadLockOutline}
                                    onClick={() =>
                                        exportNewPasswordList(group, { pwLength: 8, prefixLength: 4 })
                                    }
                                    text="Neue Passwortliste erstellen"
                                    size={SIZE_S}
                                    iconSide="left"
                                />
                            </dd>
                            <dd>
                                <Popup
                                    trigger={
                                        <div>
                                            <Button
                                                icon={mdiFormTextboxPassword}
                                                size={SIZE_S}
                                                text="Passwörter zuweisen"
                                                iconSide="left"
                                            />
                                        </div>
                                    }
                                    modal
                                    on="click"
                                    overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                                >
                                    <Card>
                                        <AssignCredentials studentGroup={group} />
                                    </Card>
                                </Popup>
                            </dd>
                            {group.studentsWithOptionalPWAuth.length > 0 && (
                                <dd>
                                    <Confirm
                                        text={`${group.studentsWithOptionalPWAuth.length} Passwort-Logins entfernen`}
                                        color="red"
                                        icon={mdiAccountRemoveOutline}
                                        iconSide="left"
                                        onConfirm={() => {
                                            Promise.all(
                                                group.studentsWithOptionalPWAuth.map((user) => {
                                                    adminStore.revokeUserPassword(user.id);
                                                })
                                            ).finally(() => {
                                                userStore.load();
                                                setSpinState(null);
                                            });
                                        }}
                                        disabled={!!spinState}
                                        size={SIZE_S}
                                        confirmText="Wirklich entfernen?"
                                    />
                                </dd>
                            )}
                        </>
                    )}

                    <dt>Erstellt Am</dt>
                    <dd>{group.fCreatedAt}</dd>

                    <dt>Letzte Änderung</dt>
                    <dd>{group.fUpdatedAt}</dd>
                    <dt>Obergruppe</dt>
                    <dd>
                        {isAdmin && group.isEditing ? (
                            <>
                                <select
                                    tabIndex={3}
                                    value={group.parentId || ''}
                                    onChange={(e) => {
                                        group.setParentId(e.target.value || null);
                                    }}
                                >
                                    <option value="">Keine</option>
                                    {groupStore.managedStudentGroups
                                        .filter((g) => g.id !== group.id)
                                        .map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                </select>
                            </>
                        ) : (
                            <>{group.parentId ? <code>{group.parentId}</code> : '-'}</>
                        )}
                    </dd>

                    <dt>Anzahl Schüler:innen</dt>
                    <dd>
                        <span className={clsx('badge badge--primary')}>
                            {group.students.filter((u) => !u.hasElevatedAccess).length}
                        </span>
                    </dd>
                    <dt>Admins</dt>
                    <dd className={clsx(styles.ddGroup)}>
                        <div className={styles.listContainer}>
                            <ul className={clsx(styles.students, styles.list)}>
                                {group.admins.map((admin, idx) => (
                                    <li key={idx} className={clsx(styles.listItem)}>
                                        {admin.nameShort}
                                        {isAdmin && (
                                            <div className={styles.actions}>
                                                <Confirm
                                                    icon={mdiAccountKey}
                                                    color="red"
                                                    size={SIZE_S}
                                                    title="Admin-Rolle zurückziehen"
                                                    disabled={group.adminIds.size === 1}
                                                    confirmText="Adminrecht entziehen?"
                                                    onConfirm={() => {
                                                        group.setAdminRole(admin, false);
                                                    }}
                                                />
                                                <Confirm
                                                    onConfirm={() => {
                                                        group.removeStudent(admin);
                                                        setRemovedIds([
                                                            ...new Set([...removedIds, admin.id])
                                                        ]);
                                                    }}
                                                    size={SIZE_S}
                                                    confirmText="Admin aus Gruppe entfernen?"
                                                    confirmColor="red"
                                                    icon={mdiClose}
                                                    confirmIcon={mdiCloseBox}
                                                    title={
                                                        group.admins.length === 1
                                                            ? 'Eine Gruppe ohne Admins ist nicht zulässig'
                                                            : 'Entfernen'
                                                    }
                                                    disabled={group.admins.length <= 1}
                                                />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </dd>

                    <dt>Mitglieder</dt>
                    <dd className={clsx(styles.ddGroup)}>
                        <div className={clsx(styles.userManagementButtons)}>
                            {isAdmin && (
                                <AddUserPopup
                                    studentGroup={group}
                                    onImported={(ids: string[], fromGroup?: StudentGroupModel) => {
                                        let fromGroups: StudentGroupModel[] | undefined;
                                        if (!fromGroup) {
                                            fromGroups = undefined;
                                        } else {
                                            fromGroups = imported?.fromGroups?.includes(fromGroup)
                                                ? imported?.fromGroups || []
                                                : [...(imported?.fromGroups || []), fromGroup];
                                        }

                                        setImported({
                                            ids: [...(imported?.ids || []), ...ids],
                                            fromGroups: fromGroups
                                        });
                                    }}
                                />
                            )}
                            {isAdmin && (
                                <Confirm
                                    className={clsx('button--block')}
                                    onConfirm={() => {
                                        setBulkRemovedIds(group.students.map((student) => student.id));
                                        group.students.forEach((student) => group.removeStudent(student));
                                    }}
                                    icon={mdiAccountCancel}
                                    color="red"
                                    text="Alle entfernen"
                                    confirmText="Alle entfernen?"
                                    iconSide="left"
                                />
                            )}
                        </div>

                        <div className={styles.listContainer}>
                            <ul className={clsx(styles.students, styles.list)}>
                                {group.students.map((student, idx) => (
                                    <li key={idx} className={clsx(styles.listItem)}>
                                        <LiveStatusIndicator
                                            userId={student.id}
                                            size={0.3}
                                            className={clsx(styles.liveStatusIndicator)}
                                        />
                                        {student.nameShort}
                                        {isAdmin && (
                                            <div className={styles.actions}>
                                                <Button
                                                    icon={mdiAccountKeyOutline}
                                                    color="blue"
                                                    size={SIZE_S}
                                                    title="Zum Admin machen"
                                                    onClick={() => {
                                                        group.setAdminRole(student, true);
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => {
                                                        group.removeStudent(student);
                                                        setRemovedIds([
                                                            ...new Set([...removedIds, student.id])
                                                        ]);
                                                    }}
                                                    size={SIZE_S}
                                                    icon={mdiClose}
                                                    color="red"
                                                    title="Entfernen"
                                                />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {removedIds.map((removedId) => (
                            <Undo
                                message={
                                    <span>
                                        Benutzer:in <strong>{userStore.find(removedId)?.nameShort}</strong>{' '}
                                        wurde entfernt.
                                    </span>
                                }
                                onUndo={() => {
                                    const user = userStore.find(removedId);
                                    if (user) {
                                        group.addStudent(user);
                                    }
                                    setRemovedIds(removedIds.filter((id) => id !== removedId));
                                }}
                                onClose={() => setRemovedIds(removedIds.filter((id) => id !== removedId))}
                            />
                        ))}
                        {imported && (
                            <Undo
                                message={
                                    <span>
                                        {imported.ids.length} Mitglieder{' '}
                                        {(imported.fromGroups?.length || 0) > 0 && (
                                            <>
                                                aus Gruppe(n){' '}
                                                <strong>
                                                    {' '}
                                                    {imported
                                                        .fromGroups!.map((group) => group.name)
                                                        .join(', ')}
                                                </strong>
                                            </>
                                        )}{' '}
                                        importiert.
                                    </span>
                                }
                                onUndo={() => {
                                    imported.ids.forEach((removedId) => {
                                        const user = userStore.find(removedId);
                                        if (user) {
                                            props.studentGroup.removeStudent(user);
                                        }
                                    });
                                    setImported(undefined);
                                }}
                                onClose={() => setImported(undefined)}
                            />
                        )}
                        {bulkRemovedIds?.length > 0 && (
                            <Undo
                                message="Alle Mitglieder entfernt."
                                onUndo={() => {
                                    bulkRemovedIds.forEach((removedId) => {
                                        const user = userStore.find(removedId);
                                        if (user) {
                                            group.addStudent(user);
                                        }
                                    });
                                    setBulkRemovedIds([]);
                                }}
                                onClose={() => setBulkRemovedIds([])}
                            />
                        )}
                    </dd>
                </DefinitionList>
                {group.children.length > 0 && (
                    <Details
                        summary={
                            <summary className={clsx(styles.childGroupSummary)}>
                                Untergruppen
                                <span className={clsx('badge badge--primary')}>{group.children.length}</span>
                            </summary>
                        }
                    >
                        <div>
                            {group.children.map((child) => (
                                <StudentGroup key={child.id} studentGroup={child} />
                            ))}
                        </div>
                    </Details>
                )}
            </div>
        </div>
    );
});

export default StudentGroup;
