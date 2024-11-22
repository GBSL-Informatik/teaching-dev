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
import { ModelMeta as DynamicDocumentRootMeta } from '@tdev-models/documents/DynamicDocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import DynamicDocumentRoots from '@tdev-components/documents/DynamicDocumentRoots';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import NoAccess from '@tdev-components/shared/NoAccess';
import TextMessages from './TextMessages';

const NoRoom = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Kein Raum ausgewählt!
        </div>
    );
};

const NoType = ({ type }: { type: string }) => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Unbekannter Raum-Typ "{type}"
        </div>
    );
};

const NotCreated = () => {
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
    parentRootId: string;
}
const RoomComponent = observer((props: Props): JSX.Element => {
    const documentStore = useStore('documentStore');
    const { roomProps: dynamicDocumentRoot } = props;
    const [dynamicRoot] = React.useState(
        new DynamicDocumentRootMeta({}, dynamicDocumentRoot.id, props.parentRootId, documentStore)
    );
    const documentRoot = useDocumentRoot(dynamicDocumentRoot.id, dynamicRoot, false, {}, true);

    if (!documentRoot || documentRoot.type !== DocumentType.DynamicDocumentRoot) {
        return <NoRoom />;
    }
    if (NoneAccess.has(documentRoot.permission)) {
        return (
            <>
                <NoAccess header={dynamicRoot.name}>
                    <PermissionsPanel
                        documentRootId={dynamicDocumentRoot.id}
                        position={['top right', 'bottom right']}
                    />
                </NoAccess>
            </>
        );
    }
    switch (dynamicDocumentRoot.type) {
        case RoomType.Messages:
            return <TextMessages documentRoot={documentRoot} roomProps={dynamicDocumentRoot} />;
        default:
            return <NoType type={dynamicDocumentRoot.type} />;
    }
});

interface WithParentRootProps {
    path: string;
}
const WithParentRoot = observer((props: WithParentRootProps): JSX.Element => {
    const userStore = useStore('userStore');
    const routeParams = matchPath<PathParams>(props.path, PATHNAME_PATTERN);
    const { parentRootId, documentRootId } = routeParams?.params || {};
    const [rootsMeta] = React.useState(new RootsMeta({}));
    const dynDocRoots = useDocumentRoot(parentRootId, rootsMeta, false, {}, true);
    if (!userStore.current) {
        return <NoUser />;
    }
    if (!parentRootId) {
        return <NoRoom />;
    }
    if (!dynDocRoots) {
        return <Loader />;
    }
    if (dynDocRoots.isDummy) {
        return <NotCreated />;
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
    return <RoomComponent roomProps={dynamicRoot} parentRootId={parentRootId} />;
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