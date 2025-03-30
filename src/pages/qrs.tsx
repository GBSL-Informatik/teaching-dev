import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';
import QrGrid from '@tdev-components/shared/QR-Code/Generator/QrGrid';

const groups = {
    'G-1': ['uzykwc', 'qtsjtm', 'iosbgr', 'ecsrjh', 'asqylk', 'ewpoue'],
    'G-2': ['kizppf', 'nrdkkd', 'xelght', 'levhbg', 'ejkvtm', 'rotrju'],
    'G-3': ['rwjfie', 'fbujxp', 'zcvofe', 'owdudn', 'ednsiq', 'zhrykg'],
    'G-4': ['flnweo', 'fuvndx', 'bifnjh', 'qikido', 'dmywpn', 'lycpmx'],
    'G-5': ['jkmvch', 'wvcsua', 'hmobdv', 'njtegs', 'glafsd', 'khfmvu'],
    'G-6': ['znqmkr', 'ojuijb', 'hgwlzg', 'bdrtyu', 'hwjgmy', 'yhixsk'],
    'G-7': ['mtrwnf', 'zahuez', 'vbrckf', 'onvfxs', 'roiwqd', 'kfphnc'],
    'G-8': ['rxczxa', 'ezjvto', 'tdneum', 'pwcjfs', 'smccvp', 'klodaj'],
    'G-9': ['qygjyr', 'larwpa', 'pijljp', 'hebdja', 'kzztxb', 'hfgfod'],
    'G-10': ['ucmkps', 'mtvbvk', 'tzksuo', 'rhajez', 'idljin', 'ojwilj']
};

export default function Home(): React.ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <main className={clsx(styles.qr)}>
                {Object.entries(groups).map(([key, val], idx) => {
                    return (
                        <React.Fragment key={idx}>
                            <h2>{key}</h2>
                            <QrGrid
                                title={key}
                                cols={2}
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
