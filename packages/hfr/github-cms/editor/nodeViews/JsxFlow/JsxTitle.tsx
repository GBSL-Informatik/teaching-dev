import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { jsxAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

interface Props extends NodeViewProps {
    isVoid: boolean;
}

/**
 * The opening tag, e.g. `<CodeShowcase lang="md">`. The attributes are cut off when space is short.
 */
const JsxTitle = observer(({ handle, isVoid }: Props) => {
    const { name, attributes } = handle.node.attrs;
    // multi-line expressions are shown on one line
    const attributesText = jsxAttributes(attributes).replace(/\s+/g, ' ');
    return (
        <span className={clsx(styles.title)}>
            <span className={clsx(styles.tag)}>{`<${name}`}</span>
            {attributesText && (
                <span className={clsx(styles.attributes)} title={attributesText.trim()}>
                    {attributesText}
                </span>
            )}
            <span className={clsx(styles.tag)}>{isVoid ? ' />' : '>'}</span>
        </span>
    );
});

export default JsxTitle;
