import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiCheckboxMultipleMarkedCircle } from '@mdi/js';
import { StateType } from '@tdev-api/document';
import Icon from '@mdi/react';
import Popup from 'reactjs-popup';
import EditingStateList from './EditingStateList';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import _ from 'lodash';
import PageStudentGroupFilter from '@tdev-components/shared/PageStudentGroupFilter';
import useIsBrowser from '@docusaurus/useIsBrowser';

export const mdiColor: { [key in StateType]: string } = {
    checked: '--ifm-color-success',
    unset: '--ifm-color-secondary-contrast-foreground',
    question: '--ifm-color-warning',
    star: '--ifm-color-primary',
    ['star-empty']: '--ifm-color-primary',
    ['star-half']: '--ifm-color-primary',
    ['clock-check']: '--ifm-color-danger',
    ['progress-check']: '--ifm-color-info'
};

interface OverviewIconProps {
    allChecked: boolean;
    someChecked: boolean;
}
const OverviewIcon = (props: OverviewIconProps) => {
    return (
        <Icon
            path={mdiCheckboxMultipleMarkedCircle}
            size={1}
            color={
                props.allChecked
                    ? 'var(--ifm-color-success)'
                    : props.someChecked
                      ? 'var(--ifm-color-warning)'
                      : 'var(--ifm-color-secondary-darkest)'
            }
        />
    );
};

const EditingOverview = observer(() => {
    const isBrowser = useIsBrowser();
    const userStore = useStore('userStore');
    const pageStore = useStore('pageStore');
    const currentUser = userStore.current;
    const currentPage = pageStore.current;
    if (!isBrowser || !currentUser || !currentPage) {
        return null;
    }
    const taskStates = currentPage.editingState.filter((ts) => RWAccess.has(ts.root?.permission)) || [];
    if (taskStates.length === 0) {
        return null;
    }
    const someChecked = taskStates.some((d) => d.isDone);
    const allChecked = someChecked && taskStates.every((d) => d.isDone);
    return (
        <div className={clsx(styles.taskStateOverview)}>
            {currentUser.hasElevatedAccess ? (
                <Popup
                    trigger={
                        <div className={styles.icon}>
                            <Button icon={mdiCheckboxMultipleMarkedCircle} size={1} color="primary" />
                        </div>
                    }
                    onOpen={() => {
                        currentPage.loadLinkedDocumentRoots();
                    }}
                    contentStyle={{
                        position: 'fixed'
                    }}
                    arrow={false}
                    repositionOnResize
                >
                    <div className={clsx('card', styles.popupCard)}>
                        <div className={clsx('card__body')}>
                            <PageStudentGroupFilter />
                            <div className={clsx(styles.overviewWrapper)}>
                                {_.orderBy(
                                    Object.values(currentPage.editingStateByUsers),
                                    (docs) => docs[0].author?.nameShort,
                                    ['asc']
                                ).map((docs, idx) => {
                                    return (
                                        <div key={idx} className={clsx(styles.usersTasks)}>
                                            <span className={styles.user}>{docs[0].author?.nameShort}</span>
                                            <div>
                                                <div className={styles.tasks}>
                                                    <EditingStateList editingStatus={docs} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {currentPage.userIdsWithoutEditingState.map((userId) => {
                                    const user = userStore.find(userId);
                                    return (
                                        <div key={userId} className={clsx(styles.usersTasks)}>
                                            <span className={styles.user}>{user!.nameShort}</span>
                                            <div>
                                                <span className="badge badge--secondary">nicht geöffnet</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Popup>
            ) : (
                <span className={styles.icon}>
                    <OverviewIcon allChecked={allChecked} someChecked={someChecked} />
                </span>
            )}
            <EditingStateList editingStatus={taskStates} />
        </div>
    );
});

export default EditingOverview;
