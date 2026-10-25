import { mdiAccountPlus, mdiAccountPlusOutline } from '@mdi/js';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import Button from '@tdev-components/shared/Button';
import type StudentGroup from '@tdev-models/StudentGroup';
import type User from '@tdev-models/User';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import sharedStyles from '../styles.module.scss';
import styles from './styles.module.scss';

interface AddUserLineProps {
    idx: number;
    user: User;
    group: StudentGroup;
    showAsSecondary: boolean;
}

const AddUserLine = observer(({ idx, user, group, showAsSecondary: showAsSecondary }: AddUserLineProps) => {
    return (
        <div
            key={idx}
            className={clsx(group.userIds.has(user.id) && sharedStyles.disabled, styles.addUserListItem)}
            title={user.email}
        >
            <div className={clsx(sharedStyles.listItem, styles.addUserListItem)}>
                <div className={styles.userInfo}>
                    <LiveStatusIndicator userId={user.id} size={0.3} /> {user.nameShort}
                </div>
                <div className={styles.groupMembership}>
                    <div className={styles.groupMembershipBadges}>
                        {user.studentGroups.map((group) => (
                            <span className="badge badge--primary">{group.name}</span>
                        ))}
                    </div>
                </div>
                <div className={sharedStyles.actions}>
                    <Button
                        onClick={() => {
                            group.addStudent(user);
                        }}
                        disabled={group.userIds.has(user.id)}
                        icon={showAsSecondary ? mdiAccountPlusOutline : mdiAccountPlus}
                        color={showAsSecondary ? 'secondary' : 'success'}
                    />
                </div>
            </div>
        </div>
    );
});

export default AddUserLine;
