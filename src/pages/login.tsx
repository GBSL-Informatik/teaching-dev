import React from 'react';
import clsx from 'clsx';
import styles from './login.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import { Redirect } from '@docusaurus/router';
import { authClient } from '@tdev/auth-client';
import Button from '@tdev-components/shared/Button';
import { mdiEmail, mdiGithub, mdiLoading, mdiMicrosoft } from '@mdi/js';
import useBaseUrl from '@docusaurus/useBaseUrl';
import DefinitionList from '@tdev-components/DefinitionList';
import CodeThemeToggle from '@tdev-components/utils/CodeThemeToggle';
import customFields from '@tdev-components/utils/customFields';
import { useStore } from '@tdev-hooks/useStore';
import Alert from '@tdev-components/shared/Alert';
import { HomepageHeader } from '@tdev-components/HomepageHeader';
const { NO_AUTH } = customFields;

const LoginPage = observer(() => {
    const { data: session } = authClient.useSession();
    const signInPage = useBaseUrl('/signIn');
    const rootUrl = useBaseUrl('/');
    const authStore = useStore('authStore');
    if (session?.user || NO_AUTH) {
        return <Redirect to={rootUrl} />;
    }
    return (
        <Layout>
            <HomepageHeader simple />
            <main className={clsx(styles.main)}>
                {authStore.authErrorMessage && (
                    <Alert
                        type="danger"
                        className={clsx(styles.authErrorMessage)}
                        onDiscard={() => authStore.setAuthErrorMessage(null)}
                    >
                        {authStore.authErrorMessage}
                    </Alert>
                )}
                <div className={clsx(styles.loginPage)}>
                    <Button
                        onClick={() => authStore.socialSignIn('microsoft')}
                        text="Schul-Account"
                        icon={authStore.isAuthenticating === 'microsoft' ? mdiLoading : mdiMicrosoft}
                        spin={authStore.isAuthenticating === 'microsoft'}
                        iconSide="left"
                        color="blue"
                        size={2}
                        className={clsx(styles.mainLoginMethod)}
                    />
                    <Button
                        onClick={() => authStore.socialSignIn('github')}
                        text="Github"
                        icon={authStore.isAuthenticating === 'github' ? mdiLoading : mdiGithub}
                        spin={authStore.isAuthenticating === 'github'}
                        iconSide="left"
                        color="black"
                    />
                    <Button href={signInPage} color="black" text="Email" icon={mdiEmail} iconSide="left" />
                </div>
                <h3>Weitere Optionen</h3>
                <DefinitionList>
                    <dt>Code Theme</dt>
                    <dd>
                        <CodeThemeToggle showText />
                    </dd>
                </DefinitionList>
            </main>
        </Layout>
    );
});

const Login = observer(() => {
    const { data: session } = authClient.useSession();
    const rootUrl = useBaseUrl('/');

    if (session?.user || NO_AUTH) {
        return <Redirect to={rootUrl} />;
    }
    return <LoginPage />;
});
export default Login;
