import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import NavReloadRequest from '@tdev-components/Admin/ActionRequest/NavReloadRequest';
import Badge from '@tdev-components/shared/Badge';
import { orderBy } from 'es-toolkit/array';
import StudentGroup from '@tdev-models/StudentGroup';
import Button from '@tdev-components/shared/Button';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import { action } from 'mobx';

interface Props {
    groups: StudentGroup[];
    showHidden?: boolean;
}

const GroupList = observer((props: Props) => {
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');
    const { groups, showHidden } = props;
    const url = useBaseUrl('/admin?panel=studentGroups');
    const viewStore = useStore('viewStore');
    return (
        <ul className={clsx(styles.quickGroupActions)}>
            {groups.map((group) => {
                const children = orderBy(
                    group.children.filter((child) => showHidden || child.isActive),
                    ['isActive', 'name'],
                    ['desc', 'asc']
                );
                return (
                    <li className={clsx(styles.item)} key={group.id}>
                        <div className={clsx(styles.count)}>
                            <Badge type="primary">{socketStore.connectedClients.get(group.id) ?? 0}</Badge>
                        </div>
                        <div className={clsx(styles.name)}>
                            {userStore.current?.hasElevatedAccess ? (
                                <Link
                                    to={url}
                                    onClick={action((e) => {
                                        viewStore.adminView.setGroupSearchFilter(group.name);
                                        [...group.parentIds, group.id].forEach((id) => {
                                            viewStore.adminView.setGroupOpen(id, true);
                                        });
                                    })}
                                >
                                    {group.name}
                                </Link>
                            ) : (
                                <b>{group.name}</b>
                            )}
                            <NavReloadRequest roomIds={[group.id]} />
                        </div>
                        <GroupList groups={children} />
                    </li>
                );
            })}
        </ul>
    );
});

const QuickGroupOverview = observer(() => {
    const [showHidden, setShowHidden] = React.useState(false);
    const groupStore = useStore('studentGroupStore');
    const hasHidden = groupStore.studentGroups.some((group) => !group.isActive);
    const groups = orderBy(
        groupStore.studentGroups.filter((group) => !group.parent && (showHidden || group.isActive)),
        ['isActive', 'name'],
        ['desc', 'asc']
    );

    return (
        <div>
            <GroupList groups={groups} showHidden={showHidden} />
            {hasHidden && (
                <Button
                    text={showHidden ? 'Versteckte Gruppen ausblenden' : 'Versteckte Gruppen anzeigen'}
                    onClick={() => setShowHidden(!showHidden)}
                />
            )}
        </div>
    );
});

export default QuickGroupOverview;
