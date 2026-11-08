import Header from '@tdev-components/BrowserWindow/Header';
import { observer } from 'mobx-react-lite';
import type { JsxAttribute } from '../../schema';
import type { NodeViewProps } from '../ReactNodeView';

/** only plain string attributes can be shown, expressions are evaluated on the page */
const stringAttribute = (attributes: JsxAttribute[], name: string) => {
    for (const attribute of attributes) {
        if (attribute.type === 'attribute' && attribute.name === name) {
            return attribute.value ?? undefined;
        }
    }
    return undefined;
};

/**
 * The header of `<BrowserWindow>`, as it is rendered on the page.
 */
const BrowserWindowHeader = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    return <Header url={stringAttribute(attributes, 'url')} href={stringAttribute(attributes, 'href')} />;
});

export default BrowserWindowHeader;
