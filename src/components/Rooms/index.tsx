import clsx from 'clsx';
import Layout from '@theme/Layout';

import { matchPath, useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import Icon from '@mdi/react';
import { mdiAccountAlert, mdiEmoticonSad } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import styles from './styles.module.scss';
import React from 'react';
import { DocumentType, DynamicDocumentRoot, RoomType } from '@tdev-api/document';
import { ModelMeta as RootsMeta } from '@tdev-models/documents/DynamicDocumentRoots';
import { default as DynamicDocumentRootMeta } from '@tdev-models/documents/DynamicDocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import DynamicDocumentRoots from '@tdev-components/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import NoAccess from '@tdev-components/shared/NoAccess';
import TextMessages from '../../../packages/tdev/text-message/TextMessages';
import RoomTypeSelector from '@tdev-components/documents/DynamicDocumentRoots/RoomTypeSelector';

const NoRoom = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Kein Raum ausgewählt!
        </div>
    );
};

const NoType = ({ dynamicRoot }: { dynamicRoot: DynamicDocumentRootMeta }) => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Unbekannter Raum-Typ "{dynamicRoot.props?.type}"
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

const NoUser = () => {
    return (
        <div className={clsx('alert alert--danger', styles.alert)} role="alert">
            <Icon path={mdiAccountAlert} size={1} color="var(--ifm-color-danger)" />
            Nicht angemeldet
        </div>
    );
};

type PathParams = { parentRootId: string; documentRootId: string };
const PATHNAME_PATTERN = '/rooms/:parentRootId/:documentRootId?' as const;

interface Props {
    roomProps: DynamicDocumentRoot;
    parentDocumentId: string;
}
const RoomComponent = observer((props: Props): React.ReactNode => {
    const documentStore = useStore('documentStore');
    const drStore = useStore('documentRootStore');
    const { roomProps } = props;
    const [dynamicRoot] = React.useState(
        new DynamicDocumentRootMeta({}, roomProps.id, props.parentDocumentId, documentStore)
    );
    const documentRoot = useDocumentRoot(roomProps.id, dynamicRoot, false, {}, true);

    if (!documentRoot || documentRoot.type !== 'dynamic_document_root') {
        return <NoRoom />;
    }
    if (NoneAccess.has(documentRoot.permission)) {
        return (
            <>
                <NoAccess header={dynamicRoot.name}>
                    <PermissionsPanel documentRootId={roomProps.id} />
                </NoAccess>
            </>
        );
    }
    switch (roomProps.type) {
        case 'text_message':
            return <TextMessages documentRoot={documentRoot} roomProps={roomProps} />;
        default:
            return <NoType dynamicRoot={dynamicRoot} />;
    }
});

interface WithParentRootProps {
    path: string;
}
const WithParentRoot = observer((props: WithParentRootProps): React.ReactNode => {
    const routeParams = matchPath<PathParams>(props.path, PATHNAME_PATTERN);
    const { parentRootId, documentRootId } = routeParams?.params || {};
    const [rootsMeta] = React.useState(new RootsMeta({}));
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
        return <DynamicDocumentRoots id={parentRootId} />;
    }
    const dynamicRoot = dynDocRoots.firstMainDocument.dynamicDocumentRoots.find(
        (ddr) => ddr.id === documentRootId
    );
    if (!dynamicRoot) {
        return <DynamicDocumentRoots id={parentRootId} />;
    }
    return <RoomComponent roomProps={dynamicRoot} parentDocumentId={dynDocRoots.firstMainDocument.id} />;
});

const Rooms = observer(() => {
    const location = useLocation();
    return (
        <Layout title={`Räume`} description="Nachrichtenräume">
            <BrowserOnly fallback={<Loader />}>
                {() => <WithParentRoot path={location.pathname} />}
            </BrowserOnly>
        </Layout>
    );
});

export default Rooms;
