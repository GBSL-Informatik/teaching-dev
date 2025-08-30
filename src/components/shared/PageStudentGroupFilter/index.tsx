import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import _ from 'es-toolkit/compat';

/**
 * Based on the current user and page, this component displays a list of
 * student groups and sets the active group for the current page.
 */
const PageStudentGroupFilter = observer(() => {
    const userStore = useStore('userStore');
    const pageStore = useStore('pageStore');
    const studentGroupStore = useStore('studentGroupStore');
    const currentUser = userStore.current;
    const currentPage = pageStore.current;
    if (!currentUser || !currentPage) {
        return null;
    }
    return (
        <div>
            <div className={clsx(styles.studentGroupSelector, 'button-group button-group--block')}>
                {studentGroupStore.managedStudentGroups
                    .filter((sg) => !sg.parentId)
                    .map((group, idx) => {
                        return (
                            <button
                                key={idx}
                                className={clsx(
                                    'button',
                                    'button--sm',
                                    currentPage.activeStudentGroup?.id === group.id ||
                                        currentPage.activeStudentGroup?.parentIds.includes(group.id)
                                        ? 'button--warning'
                                        : 'button--secondary',
                                    styles.button
                                )}
                                onClick={() => {
                                    currentPage.setPrimaryStudentGroup(group);
                                }}
                            >
                                {group.name}
                            </button>
                        );
                    })}
            </div>
            {currentPage.childStudentGroups.length > 0 && (
                <div className={clsx(styles.studentGroupSelector, 'button-group button-group--block')}>
                    {currentPage.childStudentGroups.map((group, idx) => {
                        return (
                            <button
                                key={idx}
                                className={clsx(
                                    'button',
                                    'button--sm',
                                    currentPage.activeStudentGroup?.id === group.id
                                        ? 'button--primary'
                                        : 'button--secondary',
                                    styles.button
                                )}
                                onClick={() => {
                                    currentPage.toggleActiveStudentGroup(group);
                                }}
                            >
                                {group.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export default PageStudentGroupFilter;
