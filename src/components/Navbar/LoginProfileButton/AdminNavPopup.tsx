import { mdiAccountDetailsOutline, mdiAccountSupervisorOutline, mdiShieldAccountOutline } from '@mdi/js';
import clsx from 'clsx';
import Popup from 'reactjs-popup';
import styles from './styles.module.scss';
import ProfileButton from './ProfileButton';
import Button from '@tdev-components/shared/Button';

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

const AdminNavPopup = () => {
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
};

export default AdminNavPopup;
