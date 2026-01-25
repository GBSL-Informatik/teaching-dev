import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Loader from '@tdev-components/Loader';
import AssignColumns from '@tdev-components/shared/AssignColumns';
import { Hashery } from 'hashery';
import _ from 'es-toolkit/compat';
import FromXlsxClipboard from '@tdev-components/shared/FromXlsxClipboard';
import StudentGroup from '@tdev-models/StudentGroup';
import Badge from '@tdev-components/shared/Badge';
import { authClient } from '@tdev/auth-client';
import Alert from '@tdev-components/shared/Alert';
const hashery = new Hashery();

interface Props {
    studentGroup: StudentGroup;
}

const AssignCredentials = observer((props: Props) => {
    const userStore = useStore('userStore');
    const adminStore = useStore('adminStore');

    const [state, setState] = React.useState<'paste' | 'create' | 'creating' | 'done'>('paste');
    const [tableData, setTableData] = React.useState<string[][]>([]);
    const [accounts, setAccounts] = React.useState<{ id: string; password: string }[]>([]);
    const [failedPWSets, setFailedPWSets] = React.useState<{ id: string; reason: string }[]>([]);

    return (
        <div className={clsx(styles.bulkCreation)}>
            <Badge type="info">
                Mitglieder: {props.studentGroup.userIds.size} / ({props.studentGroup.adminIds.size} Admins)
            </Badge>
            {state === 'paste' && (
                <FromXlsxClipboard
                    importLabel="Weiter zur Benutzererstellung"
                    toAssign={['[Vorname, Nachname]', '[email]', 'Passwort']}
                    matchUsers
                    includeHeader
                    onDone={(data) => {
                        if (data) {
                            setTableData(data);
                            setState('create');
                        }
                    }}
                />
            )}
            {state === 'create' && (
                <div>
                    <AssignColumns
                        table={tableData}
                        toAssign={{ userId: 'ID', password: 'Passwort' }}
                        onChange={(assigned) => {
                            if (Object.keys(assigned).length !== 2) {
                                return;
                            }
                            const userIdCol = assigned.find((a) => a.id === 'ID')?.idx ?? -1;
                            const passwordCol = assigned.find((a) => a.id === 'Passwort')?.idx ?? -1;
                            if (passwordCol === -1 || userIdCol === -1) {
                                return;
                            }
                            const credentials = tableData
                                .map((row) => ({
                                    id: row[userIdCol],
                                    password: row[passwordCol]
                                }))
                                .filter(
                                    (cred, idx) =>
                                        idx > 0 &&
                                        cred.id.trim().length > 0 &&
                                        cred.password.trim().length > 0
                                );
                            if (hashery.toHashSync(credentials) === hashery.toHashSync(accounts)) {
                                return;
                            }
                            setAccounts(credentials);
                        }}
                    />
                    <div className={clsx('button-group', 'button-group--block')}>
                        <Button
                            text={'Zurück'}
                            onClick={() => {
                                setState('paste');
                            }}
                            color="black"
                        />
                        <Button
                            text={`${accounts.length} ${accounts.length === 1 ? 'Passwort' : 'Passwörter'} setzen`}
                            onClick={() => {
                                Promise.all(
                                    accounts.map((acc) => {
                                        return adminStore.setUserPassword(acc.id, acc.password);
                                    })
                                ).then((res) => {
                                    userStore.load();
                                    setFailedPWSets(
                                        res
                                            .filter((r) => !r.success)
                                            .map((r) => ({ id: r.id, reason: r.reason! }))
                                    );
                                    setState('done');
                                });
                                setState('creating');
                            }}
                            disabled={accounts.length < 1}
                            color="primary"
                        />
                    </div>
                </div>
            )}
            {state === 'creating' && <Loader label="Passwörter werden gesetzt..." />}
            {state === 'done' && (
                <div>
                    <p>Die Accounts wurden erstellt.</p>
                    {failedPWSets.length > 0 && (
                        <Alert type="danger">
                            {`Bei ${failedPWSets.length} ${
                                failedPWSets.length === 1 ? 'Account' : 'Accounts'
                            } konnte das Passwort nicht gesetzt werden:`}
                            <ul>
                                {failedPWSets.map(({ id, reason }) => (
                                    <li key={id}>
                                        {userStore.find(id)?.email ?? id} - {reason}
                                    </li>
                                ))}
                            </ul>
                        </Alert>
                    )}
                    <Button
                        text="Mehr Passwörter setzen"
                        onClick={() => {
                            setTableData([]);
                            setAccounts([]);
                            setState('paste');
                        }}
                        color="primary"
                    />
                </div>
            )}
        </div>
    );
});

export default AssignCredentials;
