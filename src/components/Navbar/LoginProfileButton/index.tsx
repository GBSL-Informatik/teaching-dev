import useIsBrowser from '@docusaurus/useIsBrowser';
import siteConfig from '@generated/docusaurus.config';
import { mdiLogin } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import AdminNavPopup from './AdminNavPopup';
import ProfileButton from './ProfileButton';
const { NO_AUTH } = siteConfig.customFields as { NO_AUTH?: boolean };

const LoginButton = () => {
    return <Button href={'/login'} text="Login" icon={mdiLogin} color="primary" iconSide="left" />;
};

const LoginProfileButton = observer(() => {
    const isBrowser = useIsBrowser();
    const sessionStore = useStore('sessionStore');
    const userStore = useStore('userStore');

    if (!isBrowser) {
        return null;
    }

    if (!sessionStore.isLoggedIn && !NO_AUTH) {
        return <LoginButton />;
    }

    if (!userStore.current?.isAdmin && !userStore.current?.isTeacher) {
        return <ProfileButton />;
    }

    return <AdminNavPopup />;
});

export default LoginProfileButton;
