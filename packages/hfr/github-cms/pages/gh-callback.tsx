import Link from '@docusaurus/Link';
import { Redirect, useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../hooks/useCmsStore';
import { useGithubAccess } from '../hooks/useGithubAccess';
import styles from './styles.module.scss';

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
    const cmsStore = useCmsStore();
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
