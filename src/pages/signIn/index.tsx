import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';

import styles from './styles.module.scss';
import { authClient } from '@site/src/auth-client';
import { Redirect } from '@docusaurus/router';
import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { action } from 'mobx';
import Alert from '@tdev-components/shared/Alert';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { mdiLoading, mdiLogin } from '@mdi/js';
import { HomepageHeader } from '@tdev-components/HomepageHeader';

const SignIn = observer((): React.ReactNode => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const authStore = useStore('authStore');

    const { data: session } = authClient.useSession();
    React.useEffect(() => {
        return action(() => {
            authStore.setAuthErrorMessage(null);
        });
    }, [session]);

    if (session?.user) {
        return <Redirect to={'/'} />;
    }

    return (
        <Layout>
            <HomepageHeader simple />
            <main className={clsx(styles.main)}>
                <h2>Passwort-Login mit E-Mail</h2>
                {authStore.authErrorMessage && (
                    <Alert type="danger" onDiscard={() => authStore.setAuthErrorMessage(null)}>
                        {authStore.authErrorMessage}
                    </Alert>
                )}
                <form className={clsx(styles.form)}>
                    <TextInput
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(val) => setEmail(val)}
                        onEnter={() => {
                            if (email && password) {
                                authStore.signInWithEmail(email, password);
                            }
                        }}
                    />
                    <TextInput
                        type="password"
                        label="Passwort"
                        noAutoFocus
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
                            authStore.signInWithEmail(email, password);
                        }}
                        spin={authStore.isAuthenticating === 'email'}
                        text="Einloggen"
                        icon={authStore.isAuthenticating === 'email' ? mdiLoading : mdiLogin}
                        iconSide="left"
                        color="blue"
                        size={SIZE_M}
                        className={clsx(styles.signInButton)}
                    />
                </form>
            </main>
        </Layout>
    );
});
export default SignIn;
