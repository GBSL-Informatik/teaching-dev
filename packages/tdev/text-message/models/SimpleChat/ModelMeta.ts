import { TypeDataMapping, Access } from '@tdev-api/document';
import { ContainerMeta } from '@tdev-models/documents/DynamicDocumentRoots/ContainerMeta';

export interface MetaInit {
    readonly?: boolean;
    name?: string;
}

export class ModelMeta extends ContainerMeta<'simple_chat'> {
    readonly defaultName: string;

    constructor(props: Partial<MetaInit>) {
        super('simple_chat', {
            access: props.readonly ? Access.RO_User : undefined,
            description: 'Ein simpler Chat zum Senden und Empfangen von Textnachrichten.'
        });
        this.defaultName = props.name || 'Simple Chat';
    }

    get defaultData(): TypeDataMapping['simple_chat'] {
        return {
            name: this.defaultName
        };
    }
}
