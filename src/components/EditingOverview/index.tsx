import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiAccountAlert, mdiAccountSyncOutline, mdiCheckboxMultipleMarkedCircle } from '@mdi/js';
import { StateType } from '@tdev-api/document';
import Icon from '@mdi/react';
import Popup from 'reactjs-popup';
import EditingStateList from './EditingStateList';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import _ from 'es-toolkit/compat';
import PageStudentGroupFilter from '@tdev-components/shared/PageStudentGroupFilter';
import useIsBrowser from '@docusaurus/useIsBrowser';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import siteConfig from '@generated/docusaurus.config';
import type { TdevConfig } from '@tdev/siteConfig/siteConfig';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
const { tdevConfig } = siteConfig.customFields as {
    tdevConfig: Partial<TdevConfig>;
};

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
                                    if (
                                        docs[0].author?.hasElevatedAccess &&
                                        tdevConfig.taskStateOverview?.hideTeachers
                                    ) {
                                        return null;
                                    }
                                    return (
                                        <div key={idx} className={clsx(styles.usersTasks)}>
                                            <div>
                                                <LiveStatusIndicator
                                                    size={0.3}
                                                    userId={docs[0].author?.id}
                                                    className={clsx(styles.liveStatusIndicator)}
                                                />
                                                <span className={styles.user}>
                                                    {docs[0].author?.nameShort}
                                                </span>
                                            </div>
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
                                    if (!user) {
                                        /**
                                         * Happens only in rear cases, when the user list is not fully loaded yet, but the
                                         * groups are already loaded and assigned to the page.
                                         */
                                        return (
                                            <div key={userId}>
                                                <div>
                                                    <Icon path={mdiAccountSyncOutline} size={SIZE_XS} />
                                                    <div>{userId.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={userId} className={clsx(styles.usersTasks)}>
                                            <div>
                                                <LiveStatusIndicator
                                                    size={0.3}
                                                    userId={user!.id}
                                                    className={clsx(styles.liveStatusIndicator)}
                                                />
                                                <span className={styles.user}>{user!.nameShort}</span>
                                            </div>
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
