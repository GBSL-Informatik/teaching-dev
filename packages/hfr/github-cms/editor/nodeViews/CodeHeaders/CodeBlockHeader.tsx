import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import EditableText from '../../components/EditableText';
import NodeToolbar from '../../components/NodeToolbar';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const validateLanguage = (lang: string) => {
    if (/\s/.test(lang)) {
        throw new Error('Die Sprache darf keine Leerzeichen enthalten.');
    }
};

const validateMeta = (meta: string) => {
    if (meta.includes('\n')) {
        throw new Error('Die Meta-Angaben müssen auf einer Zeile stehen.');
    }
};

/**
 * The opening fence of a code block, e.g. ```` ```py live_py title="Demo" ````.
 * The language and the meta string are edited with a double click.
 */
const CodeBlockHeader = observer(({ handle }: NodeViewProps) => {
    const { lang, meta } = handle.node.attrs;
    const title = (
        <span className={clsx(styles.fence)}>
            <span className={clsx(styles.fenceStart)}>
                ```
                <EditableText
                    value={lang}
                    label="Sprache"
                    placeholder="Sprache"
                    validate={validateLanguage}
                    onApply={(lang) => handle.updateAttrs({ lang })}
                />
            </span>
            <span className={clsx(styles.divider)} />
            <EditableText
                value={meta}
                label="Meta"
                placeholder="Meta, z.B. title=..."
                validate={validateMeta}
                className={clsx(styles.meta)}
                onApply={(meta) => handle.updateAttrs({ meta })}
            />
        </span>
    );
    return <NodeToolbar handle={handle} title={title} shrinkTitle className={clsx(styles.header)} />;
});

export default CodeBlockHeader;
