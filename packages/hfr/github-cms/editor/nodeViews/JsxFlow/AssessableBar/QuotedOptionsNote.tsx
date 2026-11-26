import { mdiFormatIndentDecrease } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { quotedOptionsOffset } from '../../../assessable/choiceAnswer';
import { liftOutOfBlockquoteAt } from '../../../commands';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

/**
 * Shown when the options of a `<ChoiceAnswer>` are in the quote of its question,
 * where they are not shown as options. The button moves them out of the quote.
 */
const QuotedOptionsNote = observer(({ handle }: NodeViewProps) => {
    const offset = quotedOptionsOffset(handle.node);
    if (offset === null) {
        return null;
    }

    const handleLift = () => {
        const pos = handle.pos;
        if (pos === undefined) {
            return;
        }
        const { state, dispatch } = handle.editor;
        // the content of the question starts after its opening token
        liftOutOfBlockquoteAt(pos + 1 + offset)(state, dispatch);
    };

    return (
        <span className={clsx(styles.group, styles.warning)}>
            Die Antwortoptionen stehen im Zitat und werden nicht angezeigt.
            <Button
                icon={mdiFormatIndentDecrease}
                size={SIZE_S}
                text="Aus dem Zitat lösen"
                title="Die Liste aus dem Zitat nehmen (Shift+Tab in der Liste)"
                color="orange"
                onClick={handleLift}
            />
        </span>
    );
});

export default QuotedOptionsNote;
