import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import User from './User';
import Button from '../../shared/Button';
import { mdiSortAscending, mdiSortDescending } from '@mdi/js';
import { useStore } from '@site/src/hooks/useStore';

const SIZE_S = 0.6;

const UserTable = observer(() => {
    const [itemsShown, setItemsShown] = React.useState(15);
    const [filter, setFilter] = React.useState('');
    const currentSortColumn = React.useRef<
        'email' | 'role' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'id'
    >('email');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [sortColumn, _setSortColumn] = React.useState<
        'email' | 'role' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'id'
    >('email');
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
                    if (itemsShown < userStore.users.length) {
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
    }, [observerTarget, userStore.users.length]);

    React.useEffect(() => {
        console.log('sortColumn', sortColumn);
    }, [sortColumn]);

    const setSortColumn = (
        column: 'email' | 'role' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'id'
    ) => {
        if (column === sortColumn) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortDirection('asc');
            _setSortColumn(column);
        }
    };

    const icon = sortDirection === 'asc' ? mdiSortAscending : mdiSortDescending;
    return (
        <div className={clsx(styles.userTable)}>
            <div className={clsx('alert alert--primary', styles.filter)} role="alert">
                <input
                    type="search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="🔎 Suche"
                />
                <span className={clsx('badge', 'badge--primary')}>{`Users: ${userStore.users.length}`}</span>
            </div>
            <table className={clsx(styles.table)}>
                <thead>
                    <tr>
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
                                icon={sortColumn === 'role' && icon}
                                text={'Admin?'}
                                onClick={() => setSortColumn('role')}
                            />
                        </th>
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
                                icon={sortColumn === 'id' && icon}
                                text="ID"
                                onClick={() => setSortColumn('id')}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {userStore.users
                        .filter((user) => searchRegex.test(user.searchTerm))
                        .slice(0, itemsShown)
                        .map((user, idx) => {
                            return <User key={user.id} user={user} />;
                        })}
                </tbody>
            </table>
            <div ref={observerTarget}></div>
        </div>
    );
});

export default UserTable;
