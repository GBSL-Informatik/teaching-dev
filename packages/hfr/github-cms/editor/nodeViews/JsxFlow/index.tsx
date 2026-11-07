import { mdiTextBoxPlusOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
import { jsxAttributesToRows, rowsToJsxAttributes } from '../../components/AttributesEditor/conversions';
import NodeToolbar from '../../components/NodeToolbar';
import UuidAttributes from '../../components/UuidAttributes';
import { type ContainerFormat, schema } from '../../schema';
import type { NodeViewProps } from '../ReactNodeView';

/**
 * A jsx element, e.g. `<BrowserWindow>`. The component itself is not rendered (it might need
 * a context only available on the page), but its attributes and children can be edited.
 */
const JsxFlow = observer(({ handle }: NodeViewProps) => {
    const { name, attributes } = handle.node.attrs;
    const format: ContainerFormat | null = handle.node.attrs.format;
    const isVoid = handle.node.type === schema.nodes.jsx_flow_void;

    const handleAddChildren = () => {
        handle.replaceWith(
            schema.nodes.jsx_flow.create({ name, attributes }, schema.nodes.paragraph.create())
        );
    };

    return (
        <NodeToolbar handle={handle} title={isVoid ? `<${name} />` : `<${name}>`}>
            <UuidAttributes handle={handle} />
            {isVoid && (
                <Button
                    icon={mdiTextBoxPlusOutline}
                    size={SIZE_S}
                    title="Inhalt hinzufügen"
                    onClick={handleAddChildren}
                />
            )}
            <AttributesEditor
                title={`Attribute von <${name}>`}
                rows={jsxAttributesToRows(attributes)}
                allowExpressions
                onApply={(rows) =>
                    handle.updateAttrs({
                        attributes: rowsToJsxAttributes(rows, attributes),
                        // the original opening tag is outdated
                        format: format && { ...format, openingTag: undefined }
                    })
                }
            />
        </NodeToolbar>
    );
});

export default JsxFlow;
