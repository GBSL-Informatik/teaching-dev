import { Access, ContainerType, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';

interface Options {
    access?: Access;
    description?: string;
}

export interface MetaInit<Type extends ContainerType> {
    type: Type;
    options?: Options;
}

export class ContainerMeta<T extends ContainerType> extends TypeMeta<T> {
    readonly type: T;
    readonly description?: string;
    readonly props: Partial<{ type: T; options: Options }>;

    constructor(props: MetaInit<T>) {
        super(props.type, props.options?.access);
        this.type = props.type;
        this.description = props.options?.description;
        this.props = props;
    }

    get name(): string {
        return this.defaultData.name;
    }

    get defaultData(): TypeDataMapping[T] {
        return {
            name: this.type
        } as TypeDataMapping[T];
    }
}
