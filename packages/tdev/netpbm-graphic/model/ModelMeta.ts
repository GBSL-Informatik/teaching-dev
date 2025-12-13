import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
export interface MetaInit {
    readonly?: boolean;
    default?: string;
}

export class ModelMeta extends TypeMeta<'netpbm_graphic'> {
    readonly type = 'netpbm_graphic';
    readonly readonly?: boolean;
    readonly default?: string;

    constructor(props: Partial<MetaInit>) {
        super('netpbm_graphic', props.readonly ? Access.RO_User : undefined);
        /**
         * the default data can be either provided as a string or as a child element.
         * If it is provided as a child element, the relevant data is extracted by the
         * remark-code-as-attribute plugin. Make sure to configure it correctly.
         * @remark-code-as-attribute config
         * ```js
         * {
         *      components: [{ name: 'NetpbmEditor', attributeName: 'default' }]
         * }
         * ```
         * @example
         * <NetpbmGraphic>
         *   ```
         *   P1
         *   2 4
         *   1 0
         *   0 1
         *   ```
         * </NetpbmGraphic>
         */
        this.readonly = props.readonly;
        this.default = props.default;
    }

    get defaultData(): TypeDataMapping['netpbm_graphic'] {
        return {
            imageData: this.default || ''
        };
    }
}
