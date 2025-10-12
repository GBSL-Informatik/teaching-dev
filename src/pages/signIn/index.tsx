import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';

import styles from './styles.module.scss';
import { useStore } from '../../hooks/useStore';
import Button from '../../components/shared/Button';
import { authClient } from '@site/src/auth-client';
import { Redirect } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function SignIn(): React.ReactNode {
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
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && email && password) {
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
                        Sign In
                    </Button>
                </div>
            </main>
        </Layout>
    );
}
