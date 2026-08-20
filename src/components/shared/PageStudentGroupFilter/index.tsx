import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import _ from 'es-toolkit/compat';
import Button from '../Button';
import { mdiCollapseAll, mdiExpandAll } from '@mdi/js';

/**
 * Based on the current user and page, this component displays a list of
 * student groups and sets the active group for the current page.
 */
const PageStudentGroupFilter = observer(() => {
    const userStore = useStore('userStore');
    const pageStore = useStore('pageStore');
    const studentGroupStore = useStore('studentGroupStore');
    const [showInactiveGroups, setShowInactiveGroups] = React.useState(false);
    const currentUser = userStore.current;
    const currentPage = pageStore.current;
    if (!currentUser || !currentPage) {
        return null;
    }
    const hasInactiveSG = studentGroupStore.managedStudentGroups.some((sg) => !sg.isActive);
    const activeStudentGroup = showInactiveGroups
        ? studentGroupStore.managedStudentGroups
        : studentGroupStore.managedStudentGroups.filter((sg) => sg.isActive);
    return (
        <div>
            <div className={clsx(styles.studentGroupSelector, 'button-group button-group--block')}>
                {activeStudentGroup
                    .filter((sg) => !sg.parentId)
                    .map((group, idx) => {
                        return (
                            <button
                                key={idx}
                                className={clsx(
                                    'button',
                                    'button--sm',
                                    currentPage.viewedStudentGroup?.id === group.id ||
                                        currentPage.viewedStudentGroup?.parentIds.includes(group.id)
                                        ? 'button--warning'
                                        : 'button--secondary',
                                    styles.button
                                )}
                                onClick={() => {
                                    currentPage.setPrimaryViewedStudentGroup(group);
                                }}
                            >
                                {group.name}
                            </button>
                        );
                    })}
                {hasInactiveSG && (
                    <Button
                        icon={showInactiveGroups ? mdiCollapseAll : mdiExpandAll}
                        onClick={() => {
                            setShowInactiveGroups(!showInactiveGroups);
                        }}
                        title={
                            showInactiveGroups
                                ? 'Versteckte Gruppen ausblenden'
                                : 'Versteckte Gruppen anzeigen'
                        }
                    />
                )}
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
                                    currentPage.viewedStudentGroup?.id === group.id
                                        ? 'button--primary'
                                        : 'button--secondary',
                                    styles.button
                                )}
                                onClick={() => {
                                    currentPage.toggleViewedStudentGroup(group);
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
