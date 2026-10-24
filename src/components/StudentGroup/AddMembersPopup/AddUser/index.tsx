import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import sharedStyles from '../styles.module.scss';
import { _AddMembersPopupPropsInternal } from '../types';
import AddUserLine from './AddUserLine';
import styles from './styles.module.scss';

const AddUser = observer((props: _AddMembersPopupPropsInternal) => {
    const userStore = useStore('userStore');
    const [searchFilter, setSearchFilter] = React.useState('');
    const normalizedSearch = searchFilter.toLowerCase();

    const group = props.studentGroup;
    const users = userStore.users.filter((user) => user.searchTerm.toLowerCase().includes(normalizedSearch));
    const usersInParentGroup = users.filter((user) => group.parent?.userIds.has(user.id));
    const otherUsers = users.filter((user) => !group.parent?.userIds.has(user.id));

    return (
        <>
            <div className={clsx('card__header', sharedStyles.header)}>
                <h3>Benutzer:in hinzufügen</h3>
            </div>
            <div className={clsx('card__body', styles.addUserCardBody)}>
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchFilter}
                    className={clsx(sharedStyles.textInput)}
                    onChange={(e) => {
                        setSearchFilter(e.target.value);
                    }}
                />
                <div>
                    <div className={clsx(sharedStyles.list)}>
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
