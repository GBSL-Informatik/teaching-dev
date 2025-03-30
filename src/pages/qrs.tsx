import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';
import QrGrid from '@tdev-components/shared/QR-Code/Generator/QrGrid';

export default function Home(): React.ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <main className={clsx(styles.qr)}>
                <QrGrid
                    cols={3}
                    image="/img/logo.png"
                    iconSize={128}
                    iconColor="#01f0bc"
                    qrTexts={[
                        'https://mint-26e.gbsl.website/123qwe',
                        'https://mint-26e.gbsl.website/987qwe',
                        'https://mint-26e.gbsl.website/567qwe'
                    ]}
                    isLink
                    showText
                    size="40em"
                />
            </main>
        </Layout>
    );
}
