import { mdiTextBoxPlusOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { Node } from 'prosemirror-model';
import AttributesEditor from '../../components/AttributesEditor';
import { jsxAttributesToRows, rowsToJsxAttributes } from '../../components/AttributesEditor/conversions';
import EditableTag from '../../components/EditableTag';
import NodeToolbar from '../../components/NodeToolbar';
import UuidAttributes from '../../components/UuidAttributes';
import { jsxOpeningTagOf, parseJsxOpeningTag, withJsxOpeningTag } from '../../markdown/jsxOpeningTag';
import { jsxAttributes } from '../../markdown/serialize';
import { type ContainerFormat, type JsxAttribute, schema } from '../../schema';
import type { NodeViewProps } from '../ReactNodeView';
import BrowserWindowHeader from './BrowserWindowHeader';
import styles from './styles.module.scss';

const hasAttribute = (attributes: JsxAttribute[], name: string) =>
    attributes.some((attribute) => attribute.type !== 'spread' && attribute.name === name);

/** `<CodeShowcase>` shows its children in a `<BrowserWindow>`, unless `noBrowserWindow` is set */
const isBrowserWindow = (node: Node) => {
    const { name, attributes } = node.attrs;
    if (name === 'BrowserWindow') {
        return true;
    }
    return name === 'CodeShowcase' && !hasAttribute(attributes, 'noBrowserWindow');
};

/** `<BrowserWindow>` and `<CodeShowcase>` are framed like on the rendered page */
export const jsxFlowClassName = (node: Node) =>
    isBrowserWindow(node) ? 'cms-jsx cms-jsx--browser-window' : 'cms-jsx';

/**
 * A jsx element, e.g. `<Solution>`. The component itself is not rendered (it might need
 * a context only available on the page), but its attributes and children can be edited.
 * Simple components like `<BrowserWindow>` are styled like on the page.
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

    const browserWindow = isBrowserWindow(handle.node);

    return (
        <>
            <NodeToolbar
                handle={handle}
                title={
                    <EditableTag
                        tag={`<${name}`}
                        attributes={jsxAttributes(attributes)}
                        end={isVoid ? ' />' : '>'}
                        source={jsxOpeningTagOf(handle.node)}
                        parse={(text) => parseJsxOpeningTag(text, handle.node)}
                        onApply={(tag) => handle.updateAttrs(withJsxOpeningTag(handle.node, tag))}
                    />
                }
                shrinkTitle
                className={clsx(browserWindow && styles.browserWindowToolbar)}
            >
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
            {browserWindow && <BrowserWindowHeader handle={handle} />}
        </>
    );
});

export default JsxFlow;
