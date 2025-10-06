import useIsBrowser from '@docusaurus/useIsBrowser';
import siteConfig from '@generated/docusaurus.config';
import { mdiLogin } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import AdminNavPopup from './AdminNavPopup';
import ProfileButton from './ProfileButton';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { authClient } from '@tdev/auth-client';
const { NO_AUTH } = siteConfig.customFields as { NO_AUTH?: boolean };

const LoginButton = () => {
    const loginUrl = useBaseUrl('/login');

    return <Button href={loginUrl} text="Login" icon={mdiLogin} color="primary" iconSide="left" />;
};

const LoginProfileButton = observer(() => {
    const isBrowser = useIsBrowser();

    const { data: session } = authClient.useSession();
    const userStore = useStore('userStore');

    if (!isBrowser) {
        return null;
    }

    if (!session?.user && !NO_AUTH) {
        return <LoginButton />;
    }

    if (userStore.current?.isAdmin || userStore.current?.isTeacher) {
        return <AdminNavPopup />;
    }

    return <ProfileButton />;
});

export default LoginProfileButton;
