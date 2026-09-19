import { mdiAccountArrowLeft } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import { useStore } from '@tdev-hooks/useStore';
import User from '@tdev-models/User';
import Admonition from '@theme/Admonition';
import clsx from 'clsx';
import { debounce } from 'es-toolkit';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';
import { _AddMembersPopupPropsInternal } from './types';

const ImportFromList = observer((props: _AddMembersPopupPropsInternal) => {
    const userStore = useStore('userStore');
    const [usersToImport, setUsersToImport] = React.useState<Set<User>>(new Set());
    const [invalidEntries, setInvalidEntries] = React.useState<string[]>([]);
    const [numDuplicatesSkipped, setNumDuplicatesSkipped] = React.useState<number>(0);

    return (
        <>
            <div className={clsx('card__header', styles.header)}>
                <h3>Aus Liste importieren</h3>
            </div>
            <div className={clsx(styles.importFromList)}>
                <Button
                    text={`${usersToImport.size} Mitglied(er) hinzufügen`}
                    icon={mdiAccountArrowLeft}
                    iconSide="left"
                    color="green"
                    disabled={usersToImport.size === 0}
                    onClick={() => {
                        usersToImport.forEach((user) => props.studentGroup.addStudent(user));
                        props.onImported(Array.from(usersToImport).map((user) => user.id));
                        props.popupRef.current?.close();
                    }}
                />
                <TextAreaInput
                    onChange={debounce((val: string) => {
                        const newInvalidEntries: string[] = [];
                        let duplicatesSkipped = 0;
                        const users = val
                            .toLowerCase()
                            .split('\n')
                            .filter((emailOrId: string) => !!emailOrId)
                            .map((line: string) => {
                                const user = line.includes('@')
                                    ? userStore.users.find((user) => user.email === line)
                                    : userStore.find(line);

                                if (!user) {
                                    newInvalidEntries.push(line);
                                    return undefined;
                                }

                                return user;
                            })
                            .filter((user) => {
                                if (!user) {
                                    return false;
                                }
                                if (props.studentGroup.students.includes(user)) {
                                    duplicatesSkipped++;
                                    return false;
                                }
                                return true;
                            }) as User[];

                        setUsersToImport(new Set(users));
                        setInvalidEntries(newInvalidEntries);
                        setNumDuplicatesSkipped(duplicatesSkipped);
                    }, 300)}
                    className={clsx(styles.textArea)}
                    placeholder="Eine ID oder E-Mail pro Zeile"
                    monospace
                />
                {invalidEntries.length > 0 && (
                    <Admonition type="warning" title="Ungültige Einträge">
                        {invalidEntries.length === 1 ? '1 Eintrag' : `${invalidEntries.length} Einträge`}{' '}
                        konnten nicht zugeordnet werden und werden ignoriert:
                        <ul>
                            {invalidEntries.map((entry, index) => (
                                <li key={index}>{entry}</li>
                            ))}
                        </ul>
                    </Admonition>
                )}

                {numDuplicatesSkipped > 0 && (
                    <Admonition type="info" title="Duplikate">
                        {numDuplicatesSkipped} Benutzer:innen sind bereits Mitglied dieser Gruppe und werden
                        ignoriert.
                    </Admonition>
                )}
            </div>
        </>
    );
});

export default ImportFromList;
