import clsx from 'clsx';
import Layout from '@theme/Layout';

import { matchPath, useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import Icon from '@mdi/react';
import { mdiAccountAlert, mdiEmoticonSad, mdiRoomServiceOutline } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import styles from './styles.module.scss';
import React from 'react';
import { DynamicDocumentRoot as ApiDynamicDocumentRoot, RoomType } from '@tdev-api/document';
import { ModelMeta as RootsMeta } from '@tdev-models/documents/DynamicDocumentRoots';
import DynamicDocumentRoot, {
    MetaInit as DynamicDocumentRootMeta
} from '@tdev-models/documents/DynamicDocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import DynamicDocumentRoots from '@tdev-components/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import NoAccess from '@tdev-components/shared/NoAccess';
import RoomTypeSelector from '@tdev-components/documents/DynamicDocumentRoots/RoomTypeSelector';
import type DocumentRoot from '@tdev-models/DocumentRoot';

const NoRoom = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Kein Raum ausgewählt!
        </div>
    );
};

const NoType = ({ dynamicRoot }: { dynamicRoot: DynamicDocumentRoot<RoomType> }) => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Unbekannter Raum-Typ "{dynamicRoot.roomType}"
            <div style={{ flexGrow: 1, flexBasis: 0 }} />
            <RoomTypeSelector dynamicRoot={dynamicRoot} />
        </div>
    );
};

export const NotCreated = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Dieser Raum wurde noch nicht erzeugt. Warten auf die Lehrperson
            <div style={{ flexGrow: 1, flexBasis: 0 }} />
            <Loader noLabel />
        </div>
    );
};

type PathParams = { parentRootId: string; documentRootId: string };
const PATHNAME_PATTERN = '/rooms/:parentRootId/:documentRootId?' as const;

interface RoomSwitcherProps {
    roomType: RoomType;
    dynamicRoot: DynamicDocumentRoot<RoomType>;
    documentRoot: DocumentRoot<'dynamic_document_root'>;
    apiRoomProps: ApiDynamicDocumentRoot;
}

const RoomSwitcher = observer((props: RoomSwitcherProps) => {
    const { roomType, documentRoot, dynamicRoot, apiRoomProps } = props;
    const socketStore = useStore('socketStore');
    const componentStore = useStore('componentStore');
    const RoomComp = React.useMemo(() => componentStore.components.get(roomType)?.component, [roomType]);
    console.log('RoomComp', roomType, RoomComp);
    React.useEffect(() => {
        socketStore.joinRoom(documentRoot.id);
        return () => {
            socketStore.leaveRoom(documentRoot.id);
        };
    }, [documentRoot, socketStore.socket?.id]);
    if (!RoomComp) {
        return <NoType dynamicRoot={dynamicRoot} />;
    }
    return <RoomComp documentRoot={documentRoot} dynamicRoot={dynamicRoot} apiRoomProps={apiRoomProps} />;
});

interface Props {
    apiRoomProps: ApiDynamicDocumentRoot;
    parentDocumentId: string;
    roomType: RoomType;
}

const RoomComponent = observer((props: Props): React.ReactNode => {
    const documentStore = useStore('documentStore');
    const { apiRoomProps, roomType } = props;
    const dynamicRoot = React.useMemo(
        () =>
            new DynamicDocumentRoot(
                { roomType: roomType },
                apiRoomProps.id,
                props.parentDocumentId,
                documentStore
            ),
        [apiRoomProps.id, roomType]
    );
    const documentRoot = useDocumentRoot(apiRoomProps.id, dynamicRoot, false, {}, true);
    if (!documentRoot || documentRoot.type !== 'dynamic_document_root') {
        return <NoRoom />;
    }
    if (NoneAccess.has(documentRoot.permission)) {
        return (
            <>
                <NoAccess header={dynamicRoot.name}>
                    <PermissionsPanel documentRootId={apiRoomProps.id} />
                </NoAccess>
            </>
        );
    }
    return (
        <RoomSwitcher
            documentRoot={documentRoot}
            dynamicRoot={dynamicRoot}
            apiRoomProps={apiRoomProps}
            roomType={roomType}
        />
    );
});

interface WithModelProps {
    parentRootId: string;
    documentRootId?: string;
}

const WithParentRoot = observer((props: WithModelProps): React.ReactNode => {
    const { parentRootId, documentRootId } = props;
    const componentStore = useStore('componentStore');
    const [rootsMeta] = React.useState(new RootsMeta({ roomType: componentStore.defaultRoomType! }));
    const dynDocRoots = useDocumentRoot(parentRootId, rootsMeta, false, {}, true);
    if (dynDocRoots.isDummy) {
        return <NotCreated />;
    }
    if (!parentRootId) {
        return <NoRoom />;
    }
    if (!dynDocRoots) {
        return <Loader />;
    }
    if (!documentRootId || !dynDocRoots.firstMainDocument?.id) {
        return <DynamicDocumentRoots id={parentRootId} roomType={dynDocRoots.meta.defaultData.roomType} />;
    }
    const dynamicRoot = dynDocRoots.firstMainDocument.dynamicDocumentRoots.find(
        (ddr) => ddr.id === documentRootId
    );
    if (!dynamicRoot) {
        return <DynamicDocumentRoots id={parentRootId} roomType={dynDocRoots.meta.defaultData.roomType} />;
    }
    return (
        <RoomComponent
            apiRoomProps={dynamicRoot}
            roomType={dynDocRoots.firstMainDocument.roomType}
            parentDocumentId={dynDocRoots.firstMainDocument.id}
        />
    );
});

interface WithParentRootProps {
    path: string;
}
const WithRouteParams = observer((props: WithParentRootProps) => {
    const routeParams = matchPath<PathParams>(props.path, PATHNAME_PATTERN);
    const { parentRootId, documentRootId } = routeParams?.params || {};
    if (!parentRootId) {
        return <NoRoom />;
    }
    return <WithParentRoot parentRootId={parentRootId} documentRootId={documentRootId} />;
});

const Rooms = observer(() => {
    const location = useLocation();
    return (
        <Layout title={`Räume`} description="Nachrichtenräume">
            <BrowserOnly fallback={<Loader />}>
                {() => <WithRouteParams path={location.pathname} />}
            </BrowserOnly>
        </Layout>
    );
});

export default Rooms;
