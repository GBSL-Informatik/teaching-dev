import { Access, ContainerType, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';

interface Options {
    access?: Access;
    description?: string;
}

export class ContainerMeta<T extends ContainerType> extends TypeMeta<T> {
    readonly type: T;
    readonly description?: string;

    constructor(type: T, options?: Options) {
        super(type, options?.access);
        this.type = type;
        this.description = options?.description;
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
