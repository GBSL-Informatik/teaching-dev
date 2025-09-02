import {
    mdiAccountCircleOutline,
    mdiAccountDetailsOutline,
    mdiAccountSupervisorOutline,
    mdiShieldAccountOutline
} from '@mdi/js';
import clsx from 'clsx';
import Popup from 'reactjs-popup';
import styles from './styles.module.scss';
import ProfileButton from './ProfileButton';
import Button from '@tdev-components/shared/Button';
import { useLocation } from '@docusaurus/router';
import { useStore } from '@tdev-hooks/useStore';

interface AdminNavButtonProps {
    href: string;
    text: string;
    icon: string;
}

const AdminNavButton = ({ href, text, icon }: AdminNavButtonProps) => {
    const location = useLocation();

    return (
        <Button
            href={href}
            text={text}
            icon={icon}
            iconSide="left"
            color="primary"
            active={location.pathname + location.search === href}
            className={clsx(styles.adminNavButton)}
            textClassName={clsx(styles.adminNavButtonText)}
        />
    );
};

const AdminNavPopup = () => {
    const userStore = useStore('userStore');

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
                <AdminNavButton href="/user" text="Benutzer" icon={mdiAccountCircleOutline} />
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
};

export default AdminNavPopup;
