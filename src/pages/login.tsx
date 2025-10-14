import React from 'react';
import clsx from 'clsx';
import styles from './login.module.scss';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import { observer } from 'mobx-react-lite';
import { Redirect } from '@docusaurus/router';
import siteConfig from '@generated/docusaurus.config';
import Translate from '@docusaurus/Translate';
import { authClient } from '@tdev/auth-client';
import Button from '@tdev-components/shared/Button';
import { mdiEmail, mdiGithub, mdiMicrosoft } from '@mdi/js';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { SIZE_LG, SIZE_M } from '@tdev-components/shared/iconSizes';
const { NO_AUTH, APP_URL } = siteConfig.customFields as { NO_AUTH?: boolean; APP_URL?: string };

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
            </div>
        </header>
    );
}

const LoginPage = observer(() => {
    const { data: session } = authClient.useSession();
    const signInPage = useBaseUrl('/signIn');
    if (session?.user || NO_AUTH) {
        return <Redirect to={'/user'} />;
    }
    return (
        <Layout>
            <HomepageHeader />
            <main>
                <div className={clsx(styles.loginPage)}>
                    <Button
                        onClick={() =>
                            authClient.signIn.social({
                                provider: 'microsoft',
                                callbackURL: `${APP_URL}/user`
                            })
                        }
                        text="Schul-Account"
                        icon={mdiMicrosoft}
                        iconSide="left"
                        color="blue"
                        size={2}
                        className={clsx(styles.mainLoginMethod)}
                    />
                    <Button
                        onClick={() =>
                            authClient.signIn.social({
                                provider: 'github',
                                callbackURL: `${APP_URL}/user`
                            })
                        }
                        text="Github"
                        icon={mdiGithub}
                        iconSide="left"
                        color="black"
                    />
                    <Button href={signInPage} color="grey" text="Email" icon={mdiEmail} iconSide="left" />
                </div>
            </main>
        </Layout>
    );
});

const Login = observer(() => {
    const { data: session } = authClient.useSession();

    if (session?.user || NO_AUTH) {
        return <Redirect to={'/user'} />;
    }
    return <LoginPage />;
});
export default Login;
