import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, TypeDataMapping, Access, Factory } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { parse } from '@tdev/netpbm-graphic/model/parser/parser';
import { ParserResult } from '@tdev/netpbm-graphic/model/types';
import { ApiState } from '@tdev-stores/iStore';
import { ModelMeta } from './ModelMeta';

export const createModel: Factory<'netpbm_graphic'> = (data, store) => {
    return new NetpbmGraphic(data, store);
};

class NetpbmGraphic extends iDocument<'netpbm_graphic'> {
    @observable accessor imageData: string;
    @observable accessor formattingState: ApiState = ApiState.IDLE;
    constructor(props: DocumentProps<'netpbm_graphic'>, store: DocumentStore) {
        super(props, store);
        this.imageData = props.data?.imageData || '';
    }

    @action
    setData(data: TypeDataMapping['netpbm_graphic'], from: Source, updatedAt?: Date): void {
        this.imageData = data.imageData;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @computed
    get sanitizedData(): string {
        return this.imageData
            .trim()
            .split('\n')
            .filter((line) => !line.trim().startsWith('#')) // Remove comments.
            .join('\n');
    }

    @computed
    get parserResult(): ParserResult {
        return parse(this.sanitizedData);
    }

    @computed
    get errors() {
        return this.parserResult.errors || [];
    }

    @computed
    get warnings() {
        return this.parserResult.warnings || [];
    }

    @computed
    get hasWarnings() {
        return this.warnings.length > 0;
    }

    @computed
    get hasErrors() {
        return this.errors.length > 0;
    }

    @computed
    get hasErrorsOrWarnings() {
        return this.hasErrors || this.hasWarnings;
    }

    @computed
    get config() {
        return this.parserResult.config;
    }

    @computed
    get fileExtension() {
        switch (this.config.format) {
            case 'P1':
                return 'pbm';
            case 'P2':
                return 'pgm';
            case 'P3':
                return 'ppm';
            default:
                return 'pbm';
        }
    }

    @computed
    get width() {
        return this.config.width;
    }

    @computed
    get height() {
        return this.config.height;
    }

    @computed
    get pixels() {
        return this.parserResult.imageData?.pixels;
    }

    @action
    format() {
        this.formattingState = ApiState.SYNCING;
        const { maxValue } = this.config;
        const sz = `${maxValue || 1}`.length;
        const lines = this.imageData
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => !!l);
        const firstLineRegex = new RegExp(`^\\s*${maxValue}(?:\\s+|$)`);
        const commentRegex = /^\s*#/;
        const firstDataLine = lines.findIndex((l) => firstLineRegex.test(l));
        if (firstDataLine > -1) {
            const data = lines.slice(firstDataLine).map((l) => {
                if (commentRegex.test(l)) {
                    return l.trim();
                }
                return l
                    .split(/\s+/)
                    .filter((v) => !!v)
                    .map((v) => {
                        return v.padStart(sz, ' ');
                    })
                    .join(' ');
            });
            const formatted = [...lines.slice(0, firstDataLine), ...data].join('\n').trim();
            this.setData({ imageData: formatted }, Source.LOCAL);
        }
        this.formattingState = ApiState.SUCCESS;
        setTimeout(
            action(() => {
                this.formattingState = ApiState.IDLE;
            }),
            1500
        );
    }

    get data(): TypeDataMapping['netpbm_graphic'] {
        return {
            imageData: this.imageData
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'netpbm_graphic') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default NetpbmGraphic;
