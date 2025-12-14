import { RoomType } from '@tdev-api/document';
import type DocumentRoot from '@tdev-models/DocumentRoot';
import { DynamicDocumentRoot } from '@tdev-api/document';

interface RoomComponent {
    name: string;
    description: string;
    component: React.ComponentType<{
        documentRoot: DocumentRoot<'dynamic_document_root'>;
        roomProps: DynamicDocumentRoot;
    }>;
    default?: boolean;
}

export type RoomComponentsType = {
    [key in RoomType]?: RoomComponent;
};

const RoomComponents: RoomComponentsType = {};

export default RoomComponents;
