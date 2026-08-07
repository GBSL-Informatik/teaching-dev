import { action, computed } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { type Access, type Document as DocumentProps, type TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

interface BaseMetaProps {
    access?: Access;
    readonly?: boolean;
    pagePosition?: number;
}
export class UnknownMeta extends TypeMeta<'_unknown_'> {
    constructor(props: BaseMetaProps = {}) {
        super('_unknown_', props, true);
    }
    get defaultData(): TypeDataMapping['_unknown_'] {
        return { name: 'Unknown Document Type' };
    }
}

class Unknown extends iDocument<'_unknown_'> {
    constructor(props: DocumentProps<'_unknown_'>, store: DocumentStore) {
        super(props, store);
        throw new Error(
            `Unknown document type encountered: ${props.type}. This document type is not supported by the system.`
        );
    }

    @action
    setData(data: TypeDataMapping['_unknown_'], from: Source, updatedAt?: Date): void {
        // nop
    }

    get data(): TypeDataMapping['_unknown_'] {
        return { name: 'unknown' };
    }

    @computed
    get meta(): UnknownMeta {
        if (this.root?.type === '_unknown_') {
            return this.root.meta as UnknownMeta;
        }
        return new UnknownMeta({});
    }
}

export default Unknown;
