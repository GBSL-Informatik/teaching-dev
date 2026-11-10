import { observer } from 'mobx-react-lite';
import type { NodeViewHandle } from '../../nodeViews/ReactNodeView';
import type { ContainerFormat, DirectiveAttributes, JsxAttribute } from '../../schema';
import { isUuidV4, newUuid } from '../../uuid';
import UuidBadge from '../UuidBadge';

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
                <UuidBadge
                    key={name}
                    name={name}
                    uuid={uuid}
                    onRegenerate={() => handleRegenerate(name, uuid)}
                />
            ))}
        </>
    );
});

export default UuidAttributes;
