import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import Generator from '@tdev-components/shared/QR-Code/Generator';
import Button from '@tdev-components/shared/Button';
import { mdiQrcodeScan } from '@mdi/js';
import useBaseUrl from '@docusaurus/useBaseUrl';

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <Heading as="h1" className="hero__title">
                    {siteConfig.title}
                </Heading>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}></div>
            </div>
        </header>
    );
}

export default function Home(): React.ReactNode {
    const { siteConfig } = useDocusaurusContext();
    const scanUrl = useBaseUrl('/scan');
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <HomepageHeader />
            <main className={clsx(styles.qr)}>
                <Generator
                    image="/img/logo.png"
                    iconSize={48}
                    iconColor="#01f0bc"
                    text="https://mint-26e.gbsl.website/olwwql"
                    isLink
                    showText
                    size="22em"
                />
                <Button
                    icon={mdiQrcodeScan}
                    className={clsx(styles.scanButton)}
                    text="QR Code Scannen"
                    href={scanUrl}
                    color="primary"
                    size={3}
                    iconSide="left"
                />
            </main>
        </Layout>
    );
}
