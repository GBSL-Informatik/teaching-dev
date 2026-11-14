import { observer } from 'mobx-react-lite';
import type { Node } from 'prosemirror-model';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import EditableTag from '../../components/EditableTag';
import NodeToolbar from '../../components/NodeToolbar';
import { itemBreakHeadOf, parseItemBreakHead } from '../../markdown/directiveHead';
import { directiveAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';
import { directiveItemClassName as flexItemClassName } from './flexLayout';

const hasProps = (node: Node) => !!node.attrs.label || Object.keys(node.attrs.attributes).length > 0;

/**
 * The first item omits a `::br` without props when it is saved, it is grayed out then.
 * Whether an item is the first one is left to css: a node view is not updated when it becomes the first.
 */
export const directiveItemClassName = (node: Node) => {
    const plain = hasProps(node) ? '' : 'cms-directive-item--plain';
    return `cms-directive-item ${plain} ${flexItemClassName(node)}`;
};

/**
 * An item of `:::cards` or `:::flex`, the toolbar shows the `::br` it starts with.
 */
const DirectiveItem = observer(({ handle }: NodeViewProps) => {
    const { attributes } = handle.node.attrs;
    const settings = (
        <AttributesEditor
            title="Attribute von ::br"
            rows={directiveAttributesToRows(attributes)}
            onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
        />
    );

    return (
        <NodeToolbar
            handle={handle}
            settings={settings}
            actionsWhenActive
            title={
                <EditableTag
                    tag={<span className="cms-item-break">::br</span>}
                    attributes={directiveAttributes(attributes)}
                    source={itemBreakHeadOf(handle.node)}
                    parse={parseItemBreakHead}
                    onApply={(attributes) => handle.updateAttrs({ attributes })}
                />
            }
            shrinkTitle
        />
    );
});

export default DirectiveItem;
