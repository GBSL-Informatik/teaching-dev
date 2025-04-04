import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';
import QrGrid from '@tdev-components/shared/QR-Code/Generator/QrGrid';
import Generator from '@tdev-components/shared/QR-Code/Generator';

const groups = {
    'G-Beispiel': ['olwwql', 'omcrfc', 'mrjdcr', 'wfxnkv', 'pgemyw', 'vhsqdj'],
    'G-1': ['blusjk', 'rcyggi', 'vnaypf', 'hxbcaa', 'tmghcn', 'xjsiac'],
    'G-2': ['mhwmjw', 'tuxuck', 'ssnffg', 'swvauq', 'jjqrtz', 'ahraaa'],
    'G-3': ['fkqzke', 'hkmvox', 'ksolsr', 'ercvzt', 'fvccpc', 'wlwgum'],
    'G-4': ['dacaqx', 'qrexph', 'hmviyc', 'tsodqe', 'qlogij', 'qwilyc', 'onmzik', 'hesnqr', 'byzear'],
    'G-5': ['vlryak', 'wweyay', 'wpvbsh', 'lfrsda', 'jkvdeu', 'hjmlbu'],
    'G-6': ['isduqe', 'tixhkj', 'xijycm', 'ovallm', 'urpjrb', 'ubmqwa'],
    'G-7': ['oqkkhh', 'dhcdnq', 'hmouoj', 'kzmztj', 'nzmlss', 'idsxds'],
    'G-8': ['amsjvh', 'nfilgw', 'ubylcx', 'dlddka', 'ctatsc', 'bbxbyh'],
    'G-9': ['xtwfwk', 'ftqdgu', 'zbqpnl', 'cwdxgx', 'fjwxwl', 'glrloz'],
    'G-10': ['pcqsni', 'avqqxt', 'ehovae', 'olkwto', 'tnabrb', 'ooyllo']
};

export default function Home(): React.ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <main className={clsx(styles.qr)}>
                <Generator
                    image="/img/logo.png"
                    iconSize={226}
                    iconColor="#01f0bc"
                    text="https://mint-26e.gbsl.website/blusjk"
                    isLink
                    showText
                    download
                    size="50em"
                />
                {Object.entries(groups).map(([key, val], idx) => {
                    return (
                        <React.Fragment key={idx}>
                            <h2>{key}</h2>
                            <QrGrid
                                title={key}
                                cols={3}
                                image="/img/logo.png"
                                iconSize={128}
                                iconColor="#01f0bc"
                                qrTexts={val.map((v) => `https://mint-26e.gbsl.website/${v}`)}
                                isLink
                                showText
                                size="40em"
                            />
                        </React.Fragment>
                    );
                })}
            </main>
        </Layout>
    );
}
