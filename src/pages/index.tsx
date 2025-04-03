import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import Generator from '@tdev-components/shared/QR-Code/Generator';
import Button from '@tdev-components/shared/Button';
import { mdiQrcode, mdiQrcodeScan } from '@mdi/js';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Card from '@tdev-components/shared/Card';
import Icon from '@mdi/react';

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
            title={`MINT 26e - ${siteConfig.title}`}
            description="Sonderwoche MINT am Gymnasium Biel-Seeland"
        >
            <HomepageHeader />
            <main className={clsx(styles.qr)}>
                <Generator
                    image="/img/logo.png"
                    iconSize={48}
                    iconColor="#01f0bc"
                    text="https://mint-26e.gbsl.website/blusjk"
                    navLink="/blusjk"
                    isLink
                    showText
                    size="22em"
                    linkText="👉 Hier gehts zum ersten Rätsel!"
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
                <Card
                    style={{ maxWidth: '40em' }}
                    header={
                        <div>
                            <h3 style={{ color: 'var(--ifm-color-blue)' }}>
                                MINT-Woche der 26e{' '}
                                <Icon
                                    path={mdiQrcodeScan}
                                    size={2}
                                    style={{ lineHeight: 0, transform: 'translateY(4px)', float: 'right' }}
                                    color="var(--ifm-color-blue)"
                                />
                            </h3>
                            <small>Sonderwoche vom 31.3.2025-4.4.2025 am Gymnasium Biel-Seeland</small>
                        </div>
                    }
                >
                    <hr style={{ margin: 0, marginBottom: '5px' }} />
                    Wir erhielten die Aufgabe, verschiedene Rätsel im MINT-Bereich zu erstellen und auf die
                    Website, welche von Herrn Hofer vorbereitet wurde, hochzuladen. Über die nächsten Tage
                    haben wir selbst Rätsel gelöst, welche uns von unseren Begleitpersonen gestellt wurden und
                    gleichzeitig eigene erstellt. Am Mittwochnachmittag gingen wir als Klasse nach Bern zu den{' '}
                    <a href="https://www.bern.adventurerooms.ch/" target="_blank">
                        AdventureRooms
                    </a>{' '}
                    und haben dort spannende und inspirierende Rätsel in Form von zwei Exit-Rooms gelöst.{' '}
                    <br />
                    Am Ende der Woche hatten wir unser Endprodukt: Eine Website-basierte Schnitzeljagd mit
                    sieben verschiedenen Rätseln und sehr vielen QR-Codes{' '}
                    <Icon
                        path={mdiQrcode}
                        size={0.8}
                        style={{ lineHeight: 0, transform: 'translateY(4px)' }}
                    />
                    , die in der Schule verteilt sind.
                    <br />
                    Wenn Du also einen QR-Code aufgehängt in der Schule siehst, du etwas Zeit hast und
                    neugierig auf verschiedene Phänomene der Mathematik und Informatik bist, scann ihn tauche
                    ein!
                    <br />
                    Viel Spass 😎
                    <Icon
                        path={mdiQrcodeScan}
                        size={0.8}
                        style={{ lineHeight: 0, transform: 'translateY(4px)', float: 'right' }}
                        color="var(--ifm-color-blue)"
                    />
                </Card>
            </main>
        </Layout>
    );
}
