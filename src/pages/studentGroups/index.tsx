import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import _ from 'es-toolkit/compat';
import StudentGroupPanel from '@tdev-components/Admin/StudentGroupPanel';

const StudentGroups = observer(() => {
    return (
        <Layout>
            <main className={clsx(styles.main)}>
                <h2>Lerngruppen</h2>
                <StudentGroupPanel />
            </main>
        </Layout>
    );
});
export default StudentGroups;
