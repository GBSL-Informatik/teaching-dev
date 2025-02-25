import React from 'react';
import clsx from 'clsx';
import styles from './login.module.scss';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { observer } from 'mobx-react-lite';
import { Redirect, useHistory } from '@docusaurus/router';
import { useStore } from '@tdev-hooks/useStore';
import { useLocation } from '@docusaurus/router';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import { useGithubAccess } from '@tdev-hooks/useGithubAccess';

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

const GhCallback = observer(() => {
    const cmsStore = useStore('cmsStore');
    const access = useGithubAccess();
    const location = useLocation();
    const history = useHistory();
    const code = new URLSearchParams(location.search).get('code');
    React.useEffect(() => {
        if (code) {
            cmsStore.fetchAccessToken(code);
            history.replace('/gh-callback');
        }
    }, [history]);

    if (!code) {
        if (access === 'access') {
            return <Redirect to={'/cms'} />;
        }
        return <Redirect to={'/gh-login'} />;
    }

    return (
        <Layout>
            <HomepageHeader />
            <main>
                <CodeBlock className="language-json">
                    {JSON.stringify({ code, accessToken: code }, null, 2)}
                </CodeBlock>
                <Link to="/cms">CMS</Link>
            </main>
        </Layout>
    );
});
export default GhCallback;
