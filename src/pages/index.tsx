import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@tdev-components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import type { Navbar } from '@docusaurus/theme-common';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    const firstNavbarItem = (siteConfig.themeConfig?.navbar as Navbar | undefined)?.items?.[0];
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <Heading as="h1" className="hero__title">
                    {siteConfig.title}
                </Heading>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to={(firstNavbarItem?.to as string) ?? '/docs'}
                    >
                        {firstNavbarItem?.label ?? 'Unterlagen'} 🖼️
                    </Link>
                </div>
            </div>
        </header>
    );
}

const Home = (): React.ReactNode => {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <HomepageHeader />
            <main>
                <HomepageFeatures />
            </main>
        </Layout>
    );
};

export default Home;
