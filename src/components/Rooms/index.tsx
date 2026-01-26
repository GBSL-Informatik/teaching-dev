import clsx from 'clsx';
import Layout from '@theme/Layout';

import { matchPath, useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import Icon from '@mdi/react';
import { mdiEmoticonSad } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import styles from './styles.module.scss';
import React from 'react';
import type DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import { default as DynamicDocumentRootsComponent } from '@tdev-components/documents/DynamicDocumentRoots';
import { ModelMeta } from '@tdev-models/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import NoAccess from '@tdev-components/shared/NoAccess';
import { ContainerType } from '@tdev-api/document';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';

const NoRoom = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Kein Raum ausgewählt!
        </div>
    );
};

const NoType = ({ dynamicRoot }: { dynamicRoot: DynamicDocumentRoots<ContainerType> }) => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Unbekannter Raum-Typ "{dynamicRoot.containerType}".
        </div>
    );
};

export const NotCreated = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Dieser Dokument-Container wurde noch nicht erzeugt. Warten auf die Lehrperson.
            <div style={{ flexGrow: 1, flexBasis: 0 }} />
            <Loader noLabel />
        </div>
    );
};

type PathParams = { rootId: string; docContainerId: string };
const PATHNAME_PATTERN = '/rooms/:rootId/:docContainerId?' as const;

interface RoomSwitcherProps {
    dynamicRoot: DynamicDocumentRoots<ContainerType>;
    docContainerId: string;
}

const RoomSwitcher = observer((props: RoomSwitcherProps) => {
    const { dynamicRoot, docContainerId } = props;
    const componentStore = useStore('componentStore');
    const RoomComp = componentStore.getComponent(dynamicRoot.containerType)?.component;
    const socketStore = useStore('socketStore');
    React.useEffect(() => {
        socketStore.joinRoom(docContainerId);
        console.log(dynamicRoot.data, !!dynamicRoot.linkedDocumentContainersMap.get(docContainerId));
        dynamicRoot.linkedDocumentContainersMap.get(docContainerId)?.loadDocuments();
        return () => {
            socketStore.leaveRoom(docContainerId);
        };
    }, [dynamicRoot, socketStore.socket?.id]);
    if (!RoomComp || !dynamicRoot.linkedDocumentContainersMap.get(docContainerId)) {
        return <NoType dynamicRoot={dynamicRoot} />;
    }
    return <RoomComp documentContainer={dynamicRoot.linkedDocumentContainersMap.get(docContainerId)!} />;
});

interface Props {
    dynamicRoot: DynamicDocumentRoots<ContainerType>;
    docContainerId: string;
}

const RoomComponent = observer((props: Props): React.ReactNode => {
    const componentStore = useStore('componentStore');
    const { dynamicRoot, docContainerId } = props;
    React.useEffect(() => {
        if (dynamicRoot && dynamicRoot.linkedDocumentContainersMap.size === 0) {
            dynamicRoot.loadDocumentRoots();
        }
    }, [dynamicRoot, docContainerId]);

    const [meta] = React.useState(componentStore.getComponent(dynamicRoot.containerType)!.defaultMeta);
    if (!dynamicRoot || !meta || !dynamicRoot.documentRootIds.has(docContainerId)) {
        return <NoRoom />;
    }
    if (NoneAccess.has(dynamicRoot.root?.permission)) {
        return (
            <>
                <NoAccess header={dynamicRoot.containerType}>
                    <PermissionsPanel documentRootId={dynamicRoot.documentRootId} />
                </NoAccess>
            </>
        );
    }
    return <RoomSwitcher dynamicRoot={dynamicRoot} docContainerId={docContainerId} />;
});

interface WithModelProps {
    rootId: string;
    docContainerId?: string;
}

const WithDocumentRoot = observer((props: WithModelProps): React.ReactNode => {
    const { rootId, docContainerId } = props;
    const [meta] = React.useState(new ModelMeta({ type: 'dummy' as ContainerType }));
    const dynDoc = useFirstMainDocument(rootId, meta, false) as DynamicDocumentRoots<ContainerType> | null;

    if (!rootId || !dynDoc) {
        return <NoRoom />;
    }

    if (dynDoc.isDummy) {
        return <NotCreated />;
    }
    if (!docContainerId) {
        return <DynamicDocumentRootsComponent id={rootId} type={dynDoc.containerType} />;
    }
    return <RoomComponent dynamicRoot={dynDoc} docContainerId={docContainerId} />;
});

interface WithParentRootProps {
    path: string;
}
const WithRouteParams = observer((props: WithParentRootProps) => {
    const routeParams = matchPath<PathParams>(props.path, PATHNAME_PATTERN);
    const { rootId, docContainerId } = routeParams?.params || {};
    if (!rootId) {
        return <NoRoom />;
    }
    return <WithDocumentRoot rootId={rootId} docContainerId={docContainerId} />;
});

const Rooms = observer(() => {
    const location = useLocation();
    return (
        <Layout title={`Räume`}>
            <BrowserOnly fallback={<Loader />}>
                {() => <WithRouteParams path={location.pathname} />}
            </BrowserOnly>
        </Layout>
    );
});

export default Rooms;
