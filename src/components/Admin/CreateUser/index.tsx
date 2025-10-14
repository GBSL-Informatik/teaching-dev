import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import TextInput from '@tdev-components/shared/TextInput';
import Card from '@tdev-components/shared/Card';
import { mdiAccountPlus, mdiCheck } from '@mdi/js';
import Alert from '@tdev-components/shared/Alert';

interface Props {}

const CreateUser = observer((props: Props) => {
    const authStore = useStore('authStore');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [created, setCreated] = React.useState(false);
    const [error, setError] = React.useState('');

    return (
        <Card
            header={<h3>Neue Benutzer:in erfassen</h3>}
            footer={
                <>
                    <Button
                        onClick={() => {
                            if (created) {
                                return;
                            }
                            // call the sign up method from the auth store
                            authStore.createUser(email, password, firstName, lastName).then((res) => {
                                if (res.error) {
                                    setError(`Fehler "${res.error.message ?? res.error.statusText}".`);
                                } else {
                                    setCreated(true);
                                }
                            });
                        }}
                        disabled={!email || !password || !firstName || !lastName}
                        color={created ? 'success' : 'primary'}
                        className="button--block"
                        icon={created ? mdiCheck : mdiAccountPlus}
                    >
                        {created ? 'Erstellt' : 'Erstellen'}
                    </Button>
                    {created && (
                        <Button
                            onClick={() => {
                                setCreated(false);
                                setEmail('');
                                setPassword('');
                                setFirstName('');
                                setLastName('');
                            }}
                            color="primary"
                            className="button--block"
                            icon={mdiAccountPlus}
                        >
                            Neu
                        </Button>
                    )}
                    {error && <Alert type="danger">{error}</Alert>}
                </>
            }
            classNames={{
                card: clsx(styles.card)
            }}
        >
            <TextInput
                label="Vorname"
                value={firstName}
                required
                onChange={(val) => setFirstName(val)}
                readOnly={created}
            />
            <TextInput
                label="Nachname"
                value={lastName}
                required
                onChange={(val) => setLastName(val)}
                readOnly={created}
            />
            <TextInput
                label="Email"
                type="email"
                value={email}
                required
                onChange={(val) => setEmail(val)}
                readOnly={created}
            />
            <TextInput
                label="Password"
                required
                type={created ? 'text' : 'password'}
                value={password}
                onChange={(val) => setPassword(val)}
                readOnly={created}
                validator={(t) => {
                    if (t.length < 8) {
                        return 'Mindestens 8 Zeichen';
                    }
                    return null;
                }}
            />
        </Card>
    );
});

export default CreateUser;
