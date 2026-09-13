import Link from '@docusaurus/Link';
import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Loader from '@tdev-components/Loader';
import LoginProfileButton from '@tdev-components/Navbar/LoginProfileButton';
import Card from '@tdev-components/shared/Card';
import customFields from '@tdev-components/utils/customFields';
import { useStore } from '@tdev-hooks/useStore';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useGithubAccess } from '../hooks/useGithubAccess';
import styles from './styles.module.scss';
const { APP_URL, GH_OAUTH_CLIENT_ID } = customFields;

const callback = `${APP_URL || 'http://localhost:3000'}/gh-callback`;
const LOGIN_URL =
    `https://github.com/login/oauth/authorize?client_id=${GH_OAUTH_CLIENT_ID}&scope=repo&redirect_uri=${encodeURIComponent(callback)}` as const;

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
    const userStore = useStore('userStore');
    if (access === 'access' && userStore.current) {
        return <Redirect to={'/cms'} />;
    }
    if (access === 'loading') {
        return (
            <Layout>
                <div className={clsx(styles.loginPage)}>
                    <Card
                        header={<LoginProfileButton />}
                        style={{
                            maxWidth: '40em',
                            minWidth: '25em',
                            boxShadow: 'var(--ifm-global-shadow-md)'
                        }}
                    >
                        {userStore.current ? <Loader label="Github laden..." /> : 'Bitte zuerst einloggen'}
                    </Card>
                </div>
            </Layout>
        );
    }
    return (
        <Layout>
            <HomepageHeader />
            <main className={clsx(styles.loginPage)}>
                <Card
                    header={<LoginProfileButton />}
                    style={{
                        maxWidth: '40em',
                        minWidth: '25em',
                        boxShadow: 'var(--ifm-global-shadow-md)'
                    }}
                >
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
                </Card>
            </main>
        </Layout>
    );
});

const GhLogin = observer(() => {
    return <LoginPage />;
});
export default GhLogin;
