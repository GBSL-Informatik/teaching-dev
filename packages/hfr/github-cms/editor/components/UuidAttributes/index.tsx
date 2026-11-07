import { mdiRefresh } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { NodeViewHandle } from '../../nodeViews/ReactNodeView';
import type { ContainerFormat, DirectiveAttributes, JsxAttribute } from '../../schema';
import { isUuidV4, newUuid } from '../../uuid';
import styles from './styles.module.scss';

interface Props {
    handle: NodeViewHandle;
}

/** jsx elements store their attributes as list, directives as record */
const uuidAttributes = (attributes: JsxAttribute[] | DirectiveAttributes): [string, string][] => {
    if (Array.isArray(attributes)) {
        return attributes.flatMap((attribute) =>
            attribute.type === 'attribute' && isUuidV4(attribute.value)
                ? [[attribute.name, attribute.value] as [string, string]]
                : []
        );
    }
    return Object.entries(attributes).filter(([, value]) => isUuidV4(value));
};

const replaceUuid = (attributes: JsxAttribute[] | DirectiveAttributes, name: string, uuid: string) => {
    if (Array.isArray(attributes)) {
        return attributes.map((attribute) =>
            attribute.type === 'attribute' && attribute.name === name
                ? { ...attribute, value: uuid }
                : attribute
        );
    }
    return { ...attributes, [name]: uuid };
};

/**
 * Shows the uuid attributes (e.g. the `id` of a persisted component) of a node,
 * each with a button to replace it with a new uuid.
 */
const UuidAttributes = observer(({ handle }: Props) => {
    const { attributes } = handle.node.attrs;
    const format: ContainerFormat | null = handle.node.attrs.format ?? null;

    const handleRegenerate = (name: string, uuid: string) => {
        const regenerated = newUuid();
        handle.updateAttrs({
            attributes: replaceUuid(attributes, name, regenerated),
            // the uuid is replaced in the original tag, so its formatting is kept
            ...(format && {
                format: { ...format, openingTag: format.openingTag?.replace(uuid, regenerated) }
            })
        });
    };

    return (
        <>
            {uuidAttributes(attributes).map(([name, uuid]) => (
                <span key={name} className={clsx(styles.uuid, 'cms-uuid')} title={uuid}>
                    {name}: {uuid.slice(0, 8)}…
                    <Button
                        icon={mdiRefresh}
                        size={SIZE_XS}
                        title="Neue UUID generieren"
                        onClick={() => handleRegenerate(name, uuid)}
                    />
                </span>
            ))}
        </>
    );
});

export default UuidAttributes;
