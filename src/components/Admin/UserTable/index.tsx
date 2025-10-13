import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import UserTableRow from '@tdev-components/Admin/UserTable/User';
import Button from '@tdev-components/shared/Button';
import { mdiSortAscending, mdiSortDescending } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import _ from 'es-toolkit/compat';

const SIZE_S = 0.6;

type SortColumn =
    | 'email'
    | 'accessLevel'
    | 'firstName'
    | 'lastName'
    | 'linkedAccounts'
    | 'createdAt'
    | 'updatedAt'
    | 'groups'
    | 'id'
    | 'connectedClients';
interface Props {
    className?: string;
    filterClassName?: string;
    defaultSortColumn?: SortColumn;
    defaultSortDirection?: 'asc' | 'desc';
    showAll?: boolean;
}

const UserTable = observer((props: Props) => {
    const [itemsShown, setItemsShown] = React.useState(30);
    const [filter, setFilter] = React.useState('');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
        props.defaultSortDirection || 'asc'
    );
    const [sortColumn, _setSortColumn] = React.useState<SortColumn>(props.defaultSortColumn || 'email');
    const userStore = useStore('userStore');
    const observerTarget = React.useRef(null);
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(filter, 'i'));
    React.useEffect(() => {
        setSearchRegex(new RegExp(filter, 'i'));
    }, [filter]);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (itemsShown < userStore.managedUsers.length) {
                        setItemsShown((prev) => prev + 20);
                    }
                }
            },
            { threshold: 1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, userStore.managedUsers.length]);

    const setSortColumn = (column: SortColumn) => {
        if (column === sortColumn) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortDirection('asc');
            _setSortColumn(column);
        }
    };

    const icon = sortDirection === 'asc' ? mdiSortAscending : mdiSortDescending;
    return (
        <div className={clsx(styles.userTable, props.className)}>
            <div className={clsx('alert alert--primary', styles.filter, props.filterClassName)} role="alert">
                <input
                    type="search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="🔎 Suche"
                />
                <span
                    className={clsx('badge', 'badge--primary')}
                >{`Users: ${userStore.managedUsers.length}`}</span>
            </div>
            <div className={clsx(styles.tableWrapper)}>
                <table className={clsx(styles.table)}>
                    <thead>
                        <tr>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'connectedClients' && icon}
                                    text="On?"
                                    onClick={() => setSortColumn('connectedClients')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'email' && icon}
                                    text="Email"
                                    onClick={() => setSortColumn('email')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'accessLevel' && icon}
                                    text={'Berechtigung'}
                                    onClick={() => setSortColumn('accessLevel')}
                                />
                            </th>
                            <th></th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'firstName' && icon}
                                    text="Vorname"
                                    onClick={() => setSortColumn('firstName')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'lastName' && icon}
                                    text="Nachname"
                                    onClick={() => setSortColumn('lastName')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'createdAt' && icon}
                                    text="Erstellt"
                                    onClick={() => setSortColumn('createdAt')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'updatedAt' && icon}
                                    text="Aktualisiert"
                                    onClick={() => setSortColumn('updatedAt')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'groups' && icon}
                                    text="Lerngruppen"
                                    onClick={() => setSortColumn('groups')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'id' && icon}
                                    text="ID"
                                    onClick={() => setSortColumn('id')}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {_.orderBy(userStore.managedUsers, [sortColumn], [sortDirection])
                            .filter((user) => searchRegex.test(user.searchTerm))
                            .slice(0, props.showAll ? userStore.managedUsers.length : itemsShown)
                            .map((user, idx) => {
                                return <UserTableRow key={user.id} user={user} />;
                            })}
                    </tbody>
                </table>
            </div>
            <div ref={observerTarget}></div>
        </div>
    );
});

export default UserTable;
