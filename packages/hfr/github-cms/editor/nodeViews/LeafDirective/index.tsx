import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';
import type { Node } from 'prosemirror-model';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import NodeToolbar from '../../components/NodeToolbar';
import UuidAttributes from '../../components/UuidAttributes';
import type { NodeViewProps } from '../ReactNodeView';

/** `::br` separates the items of `:::cards` and `:::flex` */
export const isItemBreak = (node: Node) => node.attrs.name === 'br';

export const leafDirectiveClassName = (node: Node) => (isItemBreak(node) ? 'cms-item-break' : 'cms-jsx');

const ItemBreak = observer(({ handle }: NodeViewProps) => {
    const { attributes } = handle.node.attrs;
    return (
        <NodeToolbar handle={handle} title="::br · nächstes Element">
            <AttributesEditor
                title="Attribute von ::br"
                rows={directiveAttributesToRows(attributes)}
                onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
            />
        </NodeToolbar>
    );
});

/**
 * `::name[label]{attributes}`, used e.g. for media embeds like `::youtube[Title]{#id}`.
 */
const LeafDirective = observer(({ handle }: NodeViewProps) => {
    const { name, label, attributes } = handle.node.attrs;
    if (isItemBreak(handle.node)) {
        return <ItemBreak handle={handle} />;
    }
    return (
        <NodeToolbar handle={handle} title={`::${name}`}>
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
