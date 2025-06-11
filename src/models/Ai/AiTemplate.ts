import { AiStore } from '@tdev-stores/AiStore';
import { action, computed, observable } from 'mobx';
import { AiTemplate as AiTemplateProps } from '@tdev-api/admin';
import _ from 'lodash';
import JsonSchema from './JsonSchema';

const UpdateableFields: (keyof AiTemplate)[] = [
    'rateLimit',
    'rateLimitPeriodMs',
    'isActive',
    'apiKey',
    'apiUrl'
] as const;

class AiTemplate {
    readonly store: AiStore;
    readonly id: string;
    readonly authorId: string;

    @observable accessor rateLimit: number;
    @observable accessor rateLimitPeriodMs: number;
    @observable accessor isActive: boolean;

    @observable accessor apiKey: string;
    @observable accessor apiUrl: string;

    @observable.ref accessor _pristine: AiTemplateProps;

    @observable.ref accessor modelConfig: Record<string, any> = {};
    @observable accessor jsonSchema: JsonSchema | null = null;
    @observable accessor _isEditing: boolean = false;

    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(props: AiTemplateProps, store: AiStore) {
        this.store = store;
        this._pristine = { ...props };
        this.id = props.id;
        this.authorId = props.authorId;
        this.rateLimit = props.rateLimit;
        this.rateLimitPeriodMs = props.rateLimitPeriodMs;
        this.isActive = props.isActive;

        this.setConfig(props.config || {});

        // this.config = props.config;
        this.apiKey = props.apiKey;
        this.apiUrl = props.apiUrl;

        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
    }

    @computed
    get isPersisted(): boolean {
        return !this.id.startsWith('new-') && this.id.length > 0;
    }

    @action
    setModelConfig(config: Record<string, any>) {
        this.modelConfig = config;
    }

    @action
    setJsonSchema(schema: JsonSchema['serialized'] | null) {
        if (schema) {
            this.jsonSchema = new JsonSchema(schema);
        } else {
            this.jsonSchema = null;
        }
    }

    @action
    setConfig(config: Record<string, any>) {
        const { text, ...rest } = config;
        this.jsonSchema = text?.format ? new JsonSchema(text.format) : null;
        this.modelConfig = rest as Record<string, any>;
    }

    @computed
    get config(): Record<string, any> {
        const config = { ...this.modelConfig };
        if (this.jsonSchema) {
            config.text = {
                format: {
                    type: 'json_schema',
                    ...this.jsonSchema.serialized
                }
            };
        } else {
            config.text = null;
        }
        return config;
    }

    @computed
    get stringifiedConfig(): string {
        return JSON.stringify(this.config, null, 2);
    }

    @action
    discardChanges() {
        UpdateableFields.forEach((key) => {
            const pristine = (this._pristine as any)[key];
            (this as any)[key] = _.cloneDeep(pristine);
        });
        this.setJsonSchema(this._pristine.config?.text?.format || null);
    }

    @action
    setEditing(isEditing: boolean) {
        this._isEditing = isEditing;
    }

    @computed
    get isEditing(): boolean {
        return this._isEditing || !this.isPersisted;
    }

    @action
    update(props: Partial<AiTemplateProps>) {
        UpdateableFields.forEach((key) => {
            if (key in props) {
                (this as any)[key] = (props as any)[key] as any;
            }
        });
    }

    @computed
    get isDirty(): boolean {
        return Object.keys(this.dirtyProps).length > 0;
    }

    @computed
    get props(): AiTemplateProps {
        return {
            id: this.id,
            authorId: this.authorId,
            rateLimit: this.rateLimit,
            rateLimitPeriodMs: this.rateLimitPeriodMs,
            isActive: this.isActive,
            config: this.config,
            apiKey: this.apiKey,
            apiUrl: this.apiUrl,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    @computed
    get dirtyProps(): Partial<AiTemplateProps> {
        const dirtyProps: Partial<AiTemplateProps> = {};
        UpdateableFields.forEach((key) => {
            if (!_.isEqual((this._pristine as any)[key], (this as any)[key])) {
                (dirtyProps as any)[key] = (this as any)[key];
            }
        });
        if (!_.isEqual(this._pristine.config, this.config)) {
            dirtyProps.config = this.config;
        }
        return dirtyProps;
    }

    @action
    save() {
        return this.store.updateTemplate(this);
    }
}
export default AiTemplate;
