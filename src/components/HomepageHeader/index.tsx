import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';

import styles from './styles.module.scss';
import type { Navbar } from '@docusaurus/theme-common';

interface HeaderProps {
    hasCourses?: boolean;
    simple?: boolean;
}

export const HomepageHeader = (props: HeaderProps) => {
    const { siteConfig } = useDocusaurusContext();
    const firstNavbarItem = (siteConfig.themeConfig?.navbar as Navbar | undefined)?.items?.[0];
    if (props.hasCourses || props.simple) {
        return (
            <header className={clsx('hero hero--primary index-page', styles.heroBanner)}>
                <div className="container index-page-title">
                    <h1 className="hero__title">{siteConfig.title}</h1>
                    {!props.simple && <p className="hero__subtitle">{siteConfig.tagline}</p>}
                </div>
            </header>
        );
    }
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
};
