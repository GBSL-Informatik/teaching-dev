import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import EditableTag from '../../components/EditableTag';
import NodeToolbar from '../../components/NodeToolbar';
import UuidAttributes from '../../components/UuidAttributes';
import { directiveHeadOf, parseDirectiveHead } from '../../markdown/directiveHead';
import { directiveAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';

/**
 * `::name[label]{attributes}`, used e.g. for media embeds like `::youtube[Title]{#id}`.
 */
const LeafDirective = observer(({ handle }: NodeViewProps) => {
    const { name, label, attributes } = handle.node.attrs;
    return (
        <NodeToolbar
            handle={handle}
            title={
                <EditableTag
                    tag={`::${name}`}
                    attributes={directiveAttributes(attributes)}
                    source={directiveHeadOf(handle.node)}
                    parse={(text) => parseDirectiveHead(text, handle.node)}
                    onApply={(head) => handle.updateAttrs(head)}
                />
            }
            shrinkTitle
        >
            <UuidAttributes handle={handle} />
            <TextInput
                value={label}
                placeholder="Label"
                noAutoFocus
                onChange={(label) => handle.updateAttrs({ label })}
            />
            <AttributesEditor
                title={`Attribute von ::${name}`}
                rows={directiveAttributesToRows(attributes)}
                onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
            />
        </NodeToolbar>
    );
});

export default LeafDirective;
