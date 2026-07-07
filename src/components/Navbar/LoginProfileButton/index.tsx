import useIsBrowser from '@docusaurus/useIsBrowser';
import { mdiLogin } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import AdminNavPopup from './AdminNavPopup';
import ProfileButton from './ProfileButton';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { authClient } from '@tdev/auth-client';
import customFields from '@tdev-components/util/customFields';
const { NO_AUTH } = customFields;

const LoginButton = () => {
    const loginUrl = useBaseUrl('/login');

    return <Button href={loginUrl} text="Login" icon={mdiLogin} color="primary" iconSide="left" />;
};

const ApiButton = observer(() => {
    const { data: session } = authClient.useSession();
    const userStore = useStore('userStore');

    if (!session?.user && !NO_AUTH) {
        return <LoginButton />;
    }

    if (userStore.current?.hasElevatedAccess) {
        return <AdminNavPopup />;
    }

    return <ProfileButton />;
});

const OfflineButton = observer(() => {
    const userStore = useStore('userStore');

    if (userStore.current?.hasElevatedAccess) {
        return <AdminNavPopup />;
    }

    return <ProfileButton />;
});

const LoginProfileButton = observer(() => {
    const isBrowser = useIsBrowser();
    const sessionStore = useStore('sessionStore');
    if (!isBrowser) {
        return <LoginButton />;
    }
    if (sessionStore.apiMode === 'api') {
        return <ApiButton />;
    }
    return <OfflineButton />;
});

export default LoginProfileButton;
