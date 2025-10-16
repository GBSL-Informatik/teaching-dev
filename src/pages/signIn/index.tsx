import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';

import styles from './styles.module.scss';
import { useStore } from '../../hooks/useStore';
import Button from '../../components/shared/Button';
import { authClient } from '@site/src/auth-client';
import { Redirect } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';

const SignIn = observer((): React.ReactNode => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const authStore = useStore('authStore');

    const { data: session } = authClient.useSession();
    const userPage = useBaseUrl('/user');

    if (session?.user) {
        return <Redirect to={userPage} />;
    }

    return (
        <Layout>
            <main>
                <h2>Einloggen</h2>
                <div className={clsx(styles.form)}>
                    <TextInput type="email" label="Email" value={email} onChange={(val) => setEmail(val)} />
                    <TextInput
                        type="password"
                        label="Passwort"
                        value={password}
                        onChange={(val) => setPassword(val)}
                        onEnter={() => {
                            if (email && password) {
                                authStore.signInWithEmail(email, password);
                            }
                        }}
                    />
                    <Button
                        disabled={!email || !password}
                        onClick={async () => {
                            // call the sign up method from the auth store
                            authStore.signInWithEmail(email, password);
                        }}
                    >
                        Einloggen
                    </Button>
                </div>
            </main>
        </Layout>
    );
});
export default SignIn;
