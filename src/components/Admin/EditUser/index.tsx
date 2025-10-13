import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { Role, RoleAccessLevel, RoleNames, User } from '@tdev-api/user';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { authClient } from '@tdev/auth-client';
import { useStore } from '@tdev-hooks/useStore';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { mdiLoading, mdiTrashCan } from '@mdi/js';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { action } from 'mobx';
import Loader from '@tdev-components/Loader';

interface Props {
    user: User;
    close: () => void;
}

const EditUser = observer((props: Props) => {
    const { user } = props;
    const userStore = useStore('userStore');
    const adminStore = useStore('adminStore');
    const userModel = userStore.findById(user.id);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [password, setPassword] = React.useState('');

    const defaultName = React.useRef(`${user.firstName} ${user.lastName}`);
    const hasDefaultName = React.useRef(user.name === defaultName.current);
    const [name, setName] = React.useState(user.name);
    const [firstName, setFirstName] = React.useState(user.firstName);
    const [lastName, setLastName] = React.useState(user.lastName);
    return (
        <Card
            classNames={{ card: clsx(styles.editUser), body: clsx(styles.body) }}
            footer={
                <div className={clsx('button-group button-group--block')}>
                    <Button
                        className={clsx('button--block')}
                        onClick={() => {
                            props.close();
                        }}
                        color="black"
                        text="Abbrechen"
                        disabled={isDeleting}
                    />
                    <Button
                        className={clsx('button--block')}
                        color="primary"
                        onClick={() => {
                            const update: Partial<User> = {
                                firstName: firstName,
                                lastName: lastName,
                                name:
                                    hasDefaultName.current && name === user.name
                                        ? `${firstName} ${lastName}`
                                        : name
                            };
                            authClient.admin
                                .updateUser({
                                    userId: user.id,
                                    data: update
                                })
                                .then((res) => {
                                    if (res.data) {
                                        userStore.addToStore(res.data as unknown as User);
                                    }
                                    props.close();
                                });
                        }}
                        text="Speichern"
                        disabled={isDeleting}
                    />
                </div>
            }
        >
            <Card header={<h4>Berechtigung</h4>}>
                <div className={clsx(styles.role, 'button-group')}>
                    {Object.values(Role).map((role, idx) => (
                        <button
                            key={idx}
                            className={clsx(
                                'button',
                                'button--sm',
                                role === user.role ? 'button--primary' : 'button--secondary'
                            )}
                            onClick={() => {
                                userModel?.setRole(role);
                            }}
                            disabled={
                                !userStore.current ||
                                !userModel ||
                                user.id === userStore.current.id ||
                                userStore.current.accessLevel < RoleAccessLevel[role] ||
                                userModel.accessLevel > userStore.current.accessLevel
                            }
                        >
                            {RoleNames[role]}
                        </button>
                    ))}
                </div>
            </Card>
            <Card header={<h4>Eigenschaften</h4>}>
                <TextInput label="Nickname" value={name} onChange={setName} isDirty={name !== user.name} />
                <TextInput
                    label="Vorname"
                    value={firstName}
                    onChange={setFirstName}
                    isDirty={firstName !== user.firstName}
                />
                <TextInput
                    label="Nachname"
                    value={lastName}
                    onChange={setLastName}
                    isDirty={lastName !== user.lastName}
                />
            </Card>
            <Card header={<h4>Account</h4>}>
                <TextInput label="Passwort" value={password} onChange={setPassword} isDirty={!!password} />
                <Button
                    text="PW-Login erstellen"
                    onClick={() => {
                        adminStore.setUserPassword(user.id, password);
                    }}
                    color="primary"
                    disabled={!password}
                />

                <Button
                    text="PW-Login entfernen"
                    color="red"
                    onClick={() => {
                        adminStore.revokeUserPassword(user.id);
                    }}
                />
            </Card>
            <Confirm
                icon={isDeleting ? mdiLoading : mdiTrashCan}
                text="Löschen"
                size={SIZE_XS}
                spin={isDeleting}
                className={clsx(styles.delete)}
                onConfirm={() => {
                    setIsDeleting(true);
                    authClient.admin.removeUser({ userId: user.id }).then(
                        action((res) => {
                            if (res.data?.success) {
                                userStore.removeFromStore(user.id);
                                props.close();
                            }
                        })
                    );
                }}
                color="red"
                confirmText="Wirklich löschen?"
                disabled={!userStore.current?.isAdmin}
            />
            {isDeleting && <Loader overlay title="Löschen..." />}
        </Card>
    );
});

export default EditUser;
