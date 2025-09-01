import styles from './styles.module.scss';
import { mdiAccountPlus } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { _AddMembersPopupPropsInternal } from './types';
import Button from '@tdev-components/shared/Button';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';

const AddUser = observer((props: _AddMembersPopupPropsInternal) => {
    const userStore = useStore('userStore');
    const [searchFilter, setSearchFilter] = React.useState('');
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(searchFilter, 'i'));

    React.useEffect(() => {
        setSearchRegex(new RegExp(searchFilter, 'i'));
    }, [searchFilter]);

    const group = props.studentGroup;

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
                        {userStore.users
                            .filter((user) => searchRegex.test(user.searchTerm))
                            .map((user, idx) => (
                                <div
                                    key={idx}
                                    className={clsx(
                                        group.userIds.has(user.id) && styles.disabled,
                                        styles.addUserListItem
                                    )}
                                    title={user.email}
                                >
                                    <div className={styles.listItem}>
                                        <span>
                                            <LiveStatusIndicator userId={user.id} size={0.3} />{' '}
                                            {user.nameShort}
                                        </span>
                                        <div className={styles.actions}>
                                            <Button
                                                onClick={() => {
                                                    group.addStudent(user);
                                                }}
                                                disabled={group.userIds.has(user.id)}
                                                icon={mdiAccountPlus}
                                                color="green"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </>
    );
});

export default AddUser;
