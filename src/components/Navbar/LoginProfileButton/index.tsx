import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import {
    mdiAccountCircleOutline,
    mdiAccountDetailsOutline,
    mdiAccountSupervisorOutline,
    mdiLogin,
    mdiShieldAccountOutline
} from '@mdi/js';
import siteConfig from '@generated/docusaurus.config';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import useIsBrowser from '@docusaurus/useIsBrowser';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import Popup from 'reactjs-popup';
const { NO_AUTH } = siteConfig.customFields as { NO_AUTH?: boolean };

const LoginButton = () => {
    return <Button href={'/login'} text="Login" icon={mdiLogin} color="primary" iconSide="left" />;
};

const ProfileButton = () => {
    const isMobile = useIsMobileView(502);
    const userStore = useStore('userStore');
    const sessionStore = useStore('sessionStore');

    return (
        <div className={clsx(styles.profileButton, isMobile && styles.collapsed)}>
            {sessionStore.apiMode === 'api' ? (
                <>
                    <Button
                        text={userStore.viewedUser?.nameShort || 'Profil'}
                        icon={mdiAccountCircleOutline}
                        iconSide="left"
                        color="primary"
                        href="/user"
                        title="Persönlicher Bereich"
                        className={clsx(styles.button)}
                        textClassName={clsx(styles.text)}
                    />
                    <LiveStatusIndicator size={0.3} className={clsx(styles.liveIndicator)} />
                </>
            ) : (
                <Button
                    icon={sessionStore.apiModeIcon}
                    iconSide="left"
                    color="primary"
                    href="/user"
                    title="Persönlicher Bereich"
                    text="Profil"
                    className={clsx(styles.button)}
                    textClassName={clsx(styles.text)}
                />
            )}
        </div>
    );
};

interface AdminNavButtonProps {
    href: string;
    text: string;
    icon: string;
}

const AdminNavButton = ({ href, text, icon }: AdminNavButtonProps) => {
    return (
        <Button
            href={href}
            text={text}
            icon={icon}
            iconSide="left"
            color="primary"
            className={clsx(styles.adminNavButton)}
            textClassName={clsx(styles.adminNavButtonText)}
        />
    );
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

    return (
        <Popup
            trigger={
                <div>
                    <ProfileButton />
                </div>
            }
            on={['hover']}
            closeOnDocumentClick
            closeOnEscape
        >
            <div className={clsx(styles.adminNavPopup)}>
                <AdminNavButton
                    href="/admin?panel=studentGroups"
                    text="Lerngruppen"
                    icon={mdiAccountSupervisorOutline}
                />
                <AdminNavButton
                    href="/admin?panel=accounts"
                    text="Accounts"
                    icon={mdiAccountDetailsOutline}
                />
                <AdminNavButton
                    href="/admin?panel=allowedActions"
                    text="Erlaubte Aktionen"
                    icon={mdiShieldAccountOutline}
                />
            </div>
        </Popup>
    );
});

export default LoginProfileButton;
