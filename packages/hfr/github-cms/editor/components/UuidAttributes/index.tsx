import { observer } from 'mobx-react-lite';
import type { NodeViewHandle } from '../../nodeViews/ReactNodeView';
import type { ContainerFormat, DirectiveAttributes, JsxAttribute } from '../../schema';
import { isUuidV4, newUuid } from '../../uuid';
import UuidBadge from '../UuidBadge';

interface Props {
    handle: NodeViewHandle;
}

/** an `id` is shown without a uuid as well, so a uuid can be inserted */
const isUuidAttribute = (name: string, value: string | null) => name === 'id' || isUuidV4(value);

/** jsx elements store their attributes as list, directives as record */
const uuidAttributes = (attributes: JsxAttribute[] | DirectiveAttributes): [string, string | null][] => {
    if (Array.isArray(attributes)) {
        return attributes.flatMap((attribute) =>
            attribute.type === 'attribute' && isUuidAttribute(attribute.name, attribute.value)
                ? [[attribute.name, attribute.value] as [string, string | null]]
                : []
        );
    }
    return Object.entries(attributes).filter(([name, value]) => isUuidAttribute(name, value));
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

    const handleRegenerate = (name: string, value: string | null) => {
        const regenerated = newUuid();
        // a uuid is replaced in the original tag to keep its formatting, otherwise the tag is written anew
        const openingTag = isUuidV4(value) ? format?.openingTag?.replace(value, regenerated) : undefined;
        handle.updateAttrs({
            attributes: replaceUuid(attributes, name, regenerated),
            ...(format && { format: { ...format, openingTag } })
        });
    };

    return (
        <>
            {uuidAttributes(attributes).map(([name, value]) => (
                <UuidBadge
                    key={name}
                    name={name}
                    uuid={isUuidV4(value) ? value : undefined}
                    onRegenerate={() => handleRegenerate(name, value)}
                />
            ))}
        </>
    );
});

export default UuidAttributes;
