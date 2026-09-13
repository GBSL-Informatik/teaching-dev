import AdminPanel from '@tdev-components/Admin/AdminPanel';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

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
