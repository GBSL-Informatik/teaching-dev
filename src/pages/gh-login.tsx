import React from 'react';
import clsx from 'clsx';
import styles from './login.module.scss';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import { observer } from 'mobx-react-lite';
import siteConfig from '@generated/docusaurus.config';
import { useStore } from '@tdev-hooks/useStore';
import { useGithubAccess } from '@tdev-hooks/useGithubAccess';
import { Redirect } from '@docusaurus/router';
const { APP_URL } = siteConfig.customFields as { APP_URL?: string };
const callback = `${APP_URL || 'http://localhost:3000'}/gh-callback`;
const LOGIN_URL =
    `https://github.com/login/oauth/authorize?client_id=Iv23ligDNwu0p1z92UTe&scope=repo&redirect_uri=${encodeURIComponent(callback)}` as const;

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
    const access = useGithubAccess();
    if (access === 'access') {
        return <Redirect to={'/cms'} />;
    }
    if (access === 'loading') {
        return <Layout>Loading...</Layout>;
    }
    return (
        <Layout>
            <HomepageHeader />
            <main>
                <div className={clsx(styles.loginPage)}>
                    <Link
                        to={LOGIN_URL}
                        className="button button--warning"
                        style={{ color: 'black' }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = LOGIN_URL;
                        }}
                    >
                        Github Login
                    </Link>
                </div>
            </main>
        </Layout>
    );
});

const GhLogin = observer(() => {
    return <LoginPage />;
});
export default GhLogin;
