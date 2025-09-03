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
import useBaseUrl from '@docusaurus/useBaseUrl';

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
    const userUrl = useBaseUrl('/user');
    const adminUrl = useBaseUrl('/admin');

    return (
        <Popup
            trigger={
                <div>
                    <ProfileButton preventClick={true} />
                </div>
            }
            on={['hover']}
            closeOnDocumentClick
            closeOnEscape
        >
            <div className={clsx(styles.adminNavPopup)}>
                <AdminNavButton href={userUrl} text="Benutzer" icon={mdiAccountCircleOutline} />
                <AdminNavButton
                    href={`${adminUrl}?panel=studentGroups`}
                    text="Lerngruppen"
                    icon={mdiAccountSupervisorOutline}
                />
                <AdminNavButton
                    href={`${adminUrl}?panel=accounts`}
                    text="Accounts"
                    icon={mdiAccountDetailsOutline}
                />
                <AdminNavButton
                    href={`${adminUrl}?panel=allowedActions`}
                    text="Erlaubte Aktionen"
                    icon={mdiShieldAccountOutline}
                />
            </div>
        </Popup>
    );
};

export default AdminNavPopup;
