import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiAccountCircleOutline, mdiCircle, mdiLogin } from '@mdi/js';
import siteConfig from '@generated/docusaurus.config';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useIsLive } from '@tdev-hooks/useIsLive';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
const { NO_AUTH } = siteConfig.customFields as { NO_AUTH?: boolean };

const LoginButton = () => {
    return <Button href={'/login'} text="Login" icon={mdiLogin} color="primary" iconSide="left" />;
};

const LoginProfileButton = observer(() => {
    const isBrowser = useIsBrowser();
    const isMobile = useIsMobileView(502);
    const userStore = useStore('userStore');
    const sessionStore = useStore('sessionStore');
    const socketStore = useStore('socketStore');
    const isLive = useIsLive();

    if (!isBrowser) {
        return null;
    }

    if (!sessionStore.isLoggedIn && !NO_AUTH) {
        return <LoginButton />;
    }
    console.log('rerender');
    return (
        <div className={styles.profileButton}>
            {sessionStore.apiMode === 'api' ? (
                <>
                    <Button
                        text={isMobile ? (undefined as never) : userStore.viewedUser?.nameShort || 'Profil'}
                        icon={mdiAccountCircleOutline}
                        iconSide="left"
                        color="primary"
                        href="/user"
                        title="Persönlicher Bereich"
                    />
                    <Icon
                        path={mdiCircle}
                        size={0.3}
                        color={
                            (
                                userStore.isUserSwitched
                                    ? (socketStore.connectedClients.get(userStore.viewedUser?.id || ' ') ||
                                          1) -
                                          1 >
                                      0
                                    : isLive
                            )
                                ? 'var(--ifm-color-success)'
                                : 'var(--ifm-color-danger)'
                        }
                        className={clsx(styles.liveIndicator, isMobile && styles.small)}
                    />
                </>
            ) : (
                <Button
                    icon={sessionStore.apiModeIcon}
                    iconSide="left"
                    color="primary"
                    href="/user"
                    title="Persönlicher Bereich"
                />
            )}
        </div>
    );
});

export default LoginProfileButton;
