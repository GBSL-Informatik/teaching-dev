import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import EditableText from '../../../components/EditableText';
import { stringAttribute, withStringAttributes } from '../../../jsxAttributes';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/**
 * The `title` of a question in place of its tag, like the header of the question card on the page.
 * A double click edits it, the other attributes are edited in the settings.
 */
const QuestionTitle = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const title = stringAttribute(attributes, 'title') ?? '';

    const handleApply = (title: string) => {
        handle.updateAttrs({ attributes: withStringAttributes(attributes, { title }) });
    };

    return (
        <EditableText
            value={title}
            label="Titel"
            placeholder="Titel (Standard: Frage)"
            onApply={handleApply}
            className={clsx(title && styles.title)}
        />
    );
});

export default QuestionTitle;
