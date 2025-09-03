import { mdiAccountCircleOutline } from '@mdi/js';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import Button from '@tdev-components/shared/Button';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import styles from './styles.module.scss';
import useBaseUrl from '@docusaurus/useBaseUrl';

const ProfileButton = () => {
    const isMobile = useIsMobileView(502);
    const userStore = useStore('userStore');
    const sessionStore = useStore('sessionStore');
    const userUrl = useBaseUrl('/user');

    return (
        <div className={clsx(styles.profileButton, isMobile && styles.collapsed)}>
            {sessionStore.apiMode === 'api' ? (
                <>
                    <Button
                        text={userStore.viewedUser?.nameShort || 'Profil'}
                        icon={mdiAccountCircleOutline}
                        iconSide="left"
                        color="primary"
                        href={userUrl}
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
                    href={userUrl}
                    title="Persönlicher Bereich"
                    text="Profil"
                    className={clsx(styles.button)}
                    textClassName={clsx(styles.text)}
                />
            )}
        </div>
    );
};

export default ProfileButton;
