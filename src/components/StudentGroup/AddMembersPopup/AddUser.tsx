import styles from './styles.module.scss';
import { mdiAccountPlus, mdiAccountPlusOutline } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { _AddMembersPopupPropsInternal } from './types';
import Button from '@tdev-components/shared/Button';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import User from '@tdev-models/User';
import StudentGroup from '@tdev-models/StudentGroup';

interface AddUserLineProps {
    idx: number;
    user: User;
    group: StudentGroup;
    showAsSecondary: boolean;
}

const AddUserLine = ({ idx, user, group, showAsSecondary: showAsSecondary }: AddUserLineProps) => {
    return (
        <div
            key={idx}
            className={clsx(group.userIds.has(user.id) && styles.disabled, styles.addUserListItem)}
            title={user.email}
        >
            <div className={clsx(styles.listItem, styles.addUserListItem)}>
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
                <div className={styles.actions}>
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
};

const AddUser = observer((props: _AddMembersPopupPropsInternal) => {
    const userStore = useStore('userStore');
    const [searchFilter, setSearchFilter] = React.useState('');
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(searchFilter, 'i'));

    React.useEffect(() => {
        setSearchRegex(new RegExp(searchFilter, 'i'));
    }, [searchFilter]);

    const group: StudentGroup = props.studentGroup;
    const users = userStore.users.filter((user) => searchRegex.test(user.searchTerm));
    const usersInParentGroup = users.filter((user) => group.parent?.userIds.has(user.id));
    const otherUsers = users.filter((user) => !group.parent?.userIds.has(user.id));

    return (
        <>
            <div className={clsx('card__header', styles.header)}>
                <h3>Benutzer:in hinzufügen</h3>
            </div>
            <div className={clsx('card__body')}>
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchFilter}
                    className={clsx(styles.textInput)}
                    onChange={(e) => {
                        setSearchFilter(e.target.value);
                    }}
                />
                <div>
                    <div className={clsx(styles.list)}>
                        {usersInParentGroup.map((user, idx) => (
                            <AddUserLine idx={idx} user={user} group={group} showAsSecondary={false} />
                        ))}
                        {otherUsers.map((user, idx) => (
                            <AddUserLine
                                idx={idx}
                                user={user}
                                group={group}
                                showAsSecondary={usersInParentGroup.length > 0}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
});

export default AddUser;
