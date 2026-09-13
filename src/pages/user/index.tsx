import { useStore } from '@tdev-hooks/useStore';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import ApiView from './ApiView';
import LocalDbView from './LocalDbView';
import styles from './styles.module.scss';

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
