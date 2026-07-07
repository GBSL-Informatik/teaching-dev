import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import ApiView from './ApiView';
import LocalDbView from './LocalDbView';

const UserPage = observer(() => {
    const sessionStore = useStore('sessionStore');

    return (
        <Layout>
            <main className={clsx(styles.main)}>
                {sessionStore.apiMode === 'api' ? <ApiView /> : <LocalDbView />}
            </main>
        </Layout>
    );
});
export default UserPage;
