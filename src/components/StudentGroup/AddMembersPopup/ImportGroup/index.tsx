import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import sharedStyles from '../styles.module.scss';
import { _AddMembersPopupPropsInternal } from '../types';
import ImportGroupRow from './ImportGroupRow';

const ImportGroup = observer((props: _AddMembersPopupPropsInternal) => {
    const studentGroupStore = useStore('studentGroupStore');
    const [searchFilter, setSearchFilter] = React.useState('');
    const normalizedSearch = searchFilter.toLowerCase();

    return (
        <>
            <div className={clsx('card__header', sharedStyles.header)}>
                <h3>Aus Gruppe importieren</h3>
            </div>
            <div className={clsx('card__body')}>
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchFilter}
                    className={clsx(sharedStyles.textInput)}
                    onChange={(e) => {
                        setSearchFilter(e.target.value);
                    }}
                />
                <div className={sharedStyles.listContainer}>
                    <div className={clsx(sharedStyles.list)}>
                        {studentGroupStore.managedStudentGroups
                            .filter((group) => group.id !== props.studentGroup.id)
                            .filter((group) => group.searchTerm.toLowerCase().includes(normalizedSearch))
                            .map((group) => (
                                <ImportGroupRow
                                    key={group.id}
                                    sourceGroup={group}
                                    targetGroup={props.studentGroup}
                                    onImported={props.onImported}
                                />
                            ))}
                    </div>
                </div>
            </div>
        </>
    );
});

export default ImportGroup;
