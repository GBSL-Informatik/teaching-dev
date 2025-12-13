import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, TypeDataMapping, Factory } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import type { exportToBlob } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';
import { ModelMeta, MetaInit } from './ModelMeta';
import { blobToBase64 } from './helpers';
type ExportToBlobArgs = Parameters<typeof exportToBlob>[0];
type ExportToBlobReturn = ReturnType<typeof exportToBlob>;
type ExportToBlob = (args: ExportToBlobArgs) => Promise<ExportToBlobReturn>;

export const createModel: Factory<'excalidoc'> = (data, store) => {
    return new Excalidoc(data, store);
};

class Excalidoc extends iDocument<'excalidoc'> {
    @observable.ref accessor elements: readonly ExcalidrawElement[];
    @observable.ref accessor files: BinaryFiles;
    @observable.ref accessor image: string;
    constructor(props: DocumentProps<'excalidoc'>, store: DocumentStore) {
        super(props, store);
        this.elements = props.data.elements || [];
        this.files = props.data.files || {};
        this.image = props.data.image || '';
    }

    @action
    setData(
        data: TypeDataMapping['excalidoc'],
        from: Source,
        updatedAt?: Date,
        lib?: { exportToBlob: ExportToBlob } | null
    ): void {
        if (from === Source.LOCAL) {
            /**
             * Assumption:
             *  - local changes are commited only when the scene version is updated!
             *  - only non-deleted elements are commited
             */
            const updatedElements = data.elements;
            const presentFileIds = new Set(
                updatedElements.map((element) => (element.type === 'image' ? element.fileId : null))
            );
            const updatedFiles: BinaryFiles = { ...data.files };
            Object.entries(data.files).forEach(([fileId, file]) => {
                if (!presentFileIds.has(file.id)) {
                    delete updatedFiles[fileId];
                }
            });
            this.elements = updatedElements;
            this.files = updatedFiles;
            this.save(async () => {
                if (!lib) {
                    return;
                }
                return lib
                    .exportToBlob({
                        elements: updatedElements,
                        files: updatedFiles,
                        mimeType: 'image/webp',
                        quality: 0.92
                    })
                    .then((blob) => {
                        return blobToBase64(blob);
                    })
                    .then(
                        action((base64String) => {
                            if (typeof base64String === 'string') {
                                this.image = base64String;
                            }
                        })
                    )
                    .catch((e) => {
                        console.warn('Failed to export excalidraw to blob', e);
                    });
            });
        } else {
            this.elements = data.elements;
            this.files = data.files;
            this.image = data.image;
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['excalidoc'] {
        return {
            elements: this.elements,
            files: this.files,
            image: this.image
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'excalidoc') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Excalidoc;
