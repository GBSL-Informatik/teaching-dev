import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import TextInput from '@tdev-components/shared/TextInput';
import Card from '@tdev-components/shared/Card';

interface Props {}

const CreateUser = observer((props: Props) => {
    const authStore = useStore('authStore');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');

    return (
        <Card
            footer={
                <>
                    <Button
                        onClick={async () => {
                            // call the sign up method from the auth store
                            authStore.createUser(email, password, firstName, lastName);
                        }}
                        disabled={!email || !password || !firstName || !lastName}
                        color="primary"
                        className="button--block"
                    >
                        Erstellen
                    </Button>
                </>
            }
            classNames={{
                card: clsx(styles.card)
            }}
        >
            <TextInput label="Vorname" value={firstName} onChange={(val) => setFirstName(val)} />
            <TextInput label="Nachname" value={lastName} onChange={(val) => setLastName(val)} />
            <TextInput label="Email" type="email" value={email} onChange={(val) => setEmail(val)} />
            <TextInput
                label="Password"
                type="password"
                value={password}
                onChange={(val) => setPassword(val)}
            />
        </Card>
    );
});

export default CreateUser;
