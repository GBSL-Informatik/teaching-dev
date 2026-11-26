import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { TITLE } from '../../../assessable/components';
import EditableText from '../../../components/EditableText';
import { stringAttribute, withStringAttributes } from '../../../jsxAttributes';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/** the `title` of a question, a double click edits it */
const QuestionTitle = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const title = stringAttribute(attributes, TITLE) ?? '';

    const handleApply = (title: string) => {
        handle.updateAttrs({ attributes: withStringAttributes(attributes, { [TITLE]: title }) });
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
