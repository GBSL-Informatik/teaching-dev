import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import FromXlsxClipboard from '@tdev-components/shared/FromXlsxClipboard';
import AssignColumns from '@tdev-components/shared/AssignColumns';
import Button from '@tdev-components/shared/Button';
import { Hashery } from 'hashery';
import _ from 'es-toolkit/compat';
import Loader from '@tdev-components/Loader';

const hashery = new Hashery();

interface Props {}

// #TODO: Add success and error reporting for each created account
const BulkCreation = observer((props: Props) => {
    const authStore = useStore('authStore');
    const userStore = useStore('userStore');
    const [state, setState] = React.useState<'paste' | 'create' | 'creating' | 'done'>('paste');
    const [tableData, setTableData] = React.useState<string[][]>([]);
    const [accounts, setAccounts] = React.useState<{ email: string; password: string }[]>([]);

    return (
        <div className={clsx(styles.bulkCreation)}>
            {state === 'paste' && (
                <FromXlsxClipboard
                    importLabel="Weiter zur Benutzererstellung"
                    matchUsers
                    withoutKnownUsers
                    includeHeader
                    onDone={(data) => {
                        if (data) {
                            setTableData(
                                data
                                    .filter(
                                        (row, idx) =>
                                            idx === 0 || (row.length > 0 && row[0].trim().length === 0)
                                    )
                                    .map((row) => row.slice(1))
                            );
                            setState('create');
                        }
                    }}
                />
            )}
            {state === 'create' && (
                <div>
                    <AssignColumns
                        table={tableData}
                        toAssign={{ email: 'E-Mail', password: 'Passwort' }}
                        onChange={(assigned) => {
                            if (Object.keys(assigned).length !== 2) {
                                return;
                            }
                            const emailCol = assigned.find((a) => a.id === 'E-Mail')?.idx ?? -1;
                            const passwordCol = assigned.find((a) => a.id === 'Passwort')?.idx ?? -1;
                            if (emailCol === -1 || passwordCol === -1) {
                                return;
                            }
                            const newAccounts = tableData
                                .map((row) => ({
                                    email: row[emailCol],
                                    password: row[passwordCol]
                                }))
                                .filter(
                                    (acc, idx) =>
                                        idx > 0 &&
                                        acc.email.trim().length > 0 &&
                                        acc.email.includes('@') &&
                                        acc.password.trim().length > 0
                                );
                            if (hashery.toHashSync(newAccounts) === hashery.toHashSync(accounts)) {
                                return;
                            }
                            setAccounts(newAccounts);
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
                            text={`${accounts.length} Account${accounts.length === 1 ? '' : 's'} erstellen`}
                            onClick={() => {
                                Promise.all(
                                    accounts.map((acc) => {
                                        const emailName = acc.email.split('@')[0];
                                        const name = _.capitalize(emailName.split('.')[0]);
                                        const lastName = _.capitalize(emailName.split('.')[1] ?? name);
                                        return authStore
                                            .createUser(acc.email, acc.password, name, lastName)
                                            .catch((e) => {
                                                console.error(`Error creating user ${acc.email}: `, e);
                                            });
                                    })
                                ).then((res) => {
                                    userStore.load();
                                    setState('done');
                                });
                                setState('creating');
                                console.log('Creating accounts', accounts);
                            }}
                            disabled={accounts.length < 1}
                            color="primary"
                        />
                    </div>
                </div>
            )}
            {state === 'creating' && <Loader label="Accounts werden erstellt..." />}
            {state === 'done' && (
                <div>
                    <p>Die Accounts wurden erstellt.</p>
                    <Button
                        text="Neue Accounts erstellen"
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

export default BulkCreation;
