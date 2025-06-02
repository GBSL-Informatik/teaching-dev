import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { mdiLoading, mdiTarget } from '@mdi/js';
import StudentGroup from '@tdev-models/StudentGroup';
import Button from '@tdev-components/shared/Button';

interface Props {
    studentGroup: StudentGroup;
    isActiveClass?: boolean;
}

const NavSetTargetRequest = observer((props: Props) => {
    const { studentGroup } = props;
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');
    const [isLoading, setIsLoading] = React.useState(false);
    if (!userStore.current?.hasElevatedAccess) {
        return null;
    }

    return (
        <div className={clsx(styles.group)}>
            <Button
                icon={isLoading ? mdiLoading : mdiTarget}
                spin={isLoading}
                size={0.8}
                color={props.isActiveClass ? 'primary' : 'secondary'}
                title={`Seite für ${studentGroup.name} anzeigen`}
                onClick={() => {
                    setIsLoading(true);
                    socketStore
                        .requestNavigation([studentGroup.id], [], {
                            type: 'nav-target',
                            target: location.pathname
                        })
                        .finally(() => {
                            setIsLoading(false);
                        });
                }}
            >
                {studentGroup.name} ({(socketStore.connectedClients.get(studentGroup.id) || 1) - 1})
            </Button>
        </div>
    );
});

export default NavSetTargetRequest;
