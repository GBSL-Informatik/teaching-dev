import StudentGroupPanel from '@tdev-components/Admin/StudentGroupPanel';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

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
