import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import UserTableRow from '@tdev-components/Admin/UserTable/User';
import Button from '@tdev-components/shared/Button';
import {
    mdiCheckboxBlank,
    mdiCheckboxBlankOutline,
    mdiCheckboxMarked,
    mdiCheckCircle,
    mdiCheckCircleOutline,
    mdiCircleMultiple,
    mdiCircleOutline,
    mdiSortAscending,
    mdiSortDescending
} from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import _ from 'es-toolkit/compat';
import PageStudentGroupFilter from '@tdev-components/shared/PageStudentGroupFilter';
import TextInput from '@tdev-components/shared/TextInput';

const IconMap = {
    none: mdiCircleOutline,
    some: mdiCircleMultiple,
    all: mdiCheckCircle
};
const IconColor = {
    none: undefined,
    some: 'orange',
    all: 'green'
};
interface Props {
    className?: string;
    filterClassName?: string;
    tableClassName?: string;
    mode: 'single' | 'multiple';
    onChange?: (ids: string[]) => void;
}

const SelectUser = observer((props: Props) => {
    const [filter, setFilter] = React.useState('');
    const [ids, setIds] = React.useState<string[]>([]);
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(filter, 'i'));
    const pageStore = useStore('pageStore');
    const userStore = useStore('userStore');
    const currentPage = pageStore.current;
    React.useEffect(() => {
        setSearchRegex(new RegExp(filter, 'i'));
    }, [filter]);

    React.useEffect(() => {
        if (props.onChange) {
            props.onChange(ids);
        }
    }, [ids]);

    /**
     * this effect ensures that only displayed users are selected
     */
    React.useEffect(() => {
        if (currentPage?.activeStudentGroup) {
            setIds(
                ids.filter((id) => currentPage.activeStudentGroup?.students.map((s) => s.id).includes(id))
            );
        } else if (currentPage?.primaryStudentGroup) {
            setIds(
                ids.filter((id) => currentPage.primaryStudentGroup?.students.map((s) => s.id).includes(id))
            );
        }
    }, [currentPage?.activeStudentGroup, currentPage?.primaryStudentGroup]);

    if (!currentPage) {
        return null;
    }
    const users = currentPage.activeStudentGroup?.students || userStore.managedUsers;
    const selectionState = ids.length === users.length ? 'all' : ids.length === 0 ? 'none' : 'some';
    return (
        <div className={clsx(styles.selectUser, props.className)}>
            <div className={clsx('alert alert--primary', styles.filter, props.filterClassName)} role="alert">
                <TextInput
                    className={clsx(styles.filterInput)}
                    type="search"
                    value={filter}
                    onChange={(text) => setFilter(text)}
                    placeholder="🔎 Filtern"
                />
                <span className={clsx('badge', 'badge--primary')}>{`Users: ${users.length}`}</span>
            </div>
            <PageStudentGroupFilter />
            <div className={clsx(styles.tableWrapper, props.tableClassName)}>
                <table className={clsx(styles.table)}>
                    <thead>
                        <tr>
                            <th>
                                {props.mode === 'single' ? (
                                    <>Auswahl</>
                                ) : (
                                    <Button
                                        noBorder
                                        icon={IconMap[selectionState]}
                                        onClick={() => {
                                            setIds(
                                                ids.length === users.length
                                                    ? []
                                                    : users.map((user) => user.id)
                                            );
                                        }}
                                        color={IconColor[selectionState]}
                                    />
                                )}
                            </th>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {_.orderBy(users, ['name'], ['asc'])
                            .filter((user) => searchRegex.test(user.searchTerm))
                            .map((user, idx) => {
                                const selected = ids.includes(user.id);
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <Button
                                                noBorder
                                                icon={
                                                    props.mode === 'single'
                                                        ? selected
                                                            ? mdiCheckCircle
                                                            : mdiCircleOutline
                                                        : selected
                                                          ? mdiCheckboxMarked
                                                          : mdiCheckboxBlankOutline
                                                }
                                                color={selected ? 'green' : undefined}
                                                onClick={() => {
                                                    if (props.mode === 'single') {
                                                        setIds([user.id]);
                                                    } else {
                                                        if (selected) {
                                                            setIds(ids.filter((id) => id !== user.id));
                                                        } else {
                                                            setIds([...ids, user.id]);
                                                        }
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{user.name}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default SelectUser;
