import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import _ from 'lodash';
import AdminPanel from '@tdev-components/Admin/AdminPanel';

const StudentGroups = observer(() => {
    return (
        <Layout>
            <main className={clsx(styles.main)}>
                <AdminPanel />
            </main>
        </Layout>
    );
});
export default StudentGroups;
