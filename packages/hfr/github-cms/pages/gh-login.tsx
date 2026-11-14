import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Loader from '@tdev-components/Loader';
import LoginProfileButton from '@tdev-components/Navbar/LoginProfileButton';
import Card from '@tdev-components/shared/Card';
import { useStore } from '@tdev-hooks/useStore';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useGithubAccess } from '../hooks/useGithubAccess';
import { createGithubLoginUrl } from '../models/githubLogin';
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

const handleLogin = () => {
    window.location.href = createGithubLoginUrl();
};

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
                        <button
                            className="button button--warning"
                            style={{ color: 'black' }}
                            onClick={handleLogin}
                        >
                            Github Login
                        </button>
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
