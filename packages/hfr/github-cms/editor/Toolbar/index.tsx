import {
    mdiCodeJson,
    mdiCodeTags,
    mdiFileCompare,
    mdiFormatBold,
    mdiFormatItalic,
    mdiFormatListBulleted,
    mdiFormatListNumbered,
    mdiFormatQuoteClose,
    mdiFormatStrikethroughVariant,
    mdiKeyboardOutline,
    mdiRedo,
    mdiSquareRoundedBadgeOutline,
    mdiUndo
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import SelectInput from '@tdev-components/shared/SelectInput';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { MarkType } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import Actions from '../../components/MdxEditor/toolbar/Actions';
import {
    type BlockType,
    currentBlockType,
    setCurrentBlockType,
    toggleBlockquote,
    toggleList
} from '../commands';
import type MdxDocument from '../models/MdxDocument';
import { schema } from '../schema';
import InsertMenu from './InsertMenu';
import LinkButton from './LinkButton';
import styles from './styles.module.scss';
import TableActions from './TableActions';

interface Props {
    document: MdxDocument;
}

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
    { value: 'paragraph', label: 'Text' },
    { value: 'heading1', label: 'Titel 1' },
    { value: 'heading2', label: 'Titel 2' },
    { value: 'heading3', label: 'Titel 3' },
    { value: 'heading4', label: 'Titel 4' },
    { value: 'heading5', label: 'Titel 5' },
    { value: 'heading6', label: 'Titel 6' }
];

const markButton = (mark: MarkType, icon: string, title: string) => ({
    mark,
    icon,
    title,
    command: toggleMark(mark)
});

const MARK_BUTTONS = [
    markButton(schema.marks.strong, mdiFormatBold, 'Fett (Strg+B)'),
    markButton(schema.marks.emphasis, mdiFormatItalic, 'Kursiv (Strg+I)'),
    markButton(schema.marks.delete, mdiFormatStrikethroughVariant, 'Durchgestrichen'),
    markButton(schema.marks.box, mdiSquareRoundedBadgeOutline, 'Umrandet __text__ (Strg+U)'),
    markButton(schema.marks.kbd, mdiKeyboardOutline, 'Taste [[Strg]] (Strg+K)'),
    markButton(schema.marks.code, mdiCodeTags, 'Code (Strg+E)')
];

/**
 * The controls to edit the document, hidden while the diff is shown.
 */
const EditingTools = observer(({ document }: Props) => {
    const blockType = currentBlockType(document.state);
    return (
        <>
            <div className={clsx(styles.group)}>
                <Button
                    icon={mdiUndo}
                    size={SIZE_S}
                    title="Rückgängig"
                    disabled={!document.canRun(undo)}
                    onClick={() => document.run(undo)}
                />
                <Button
                    icon={mdiRedo}
                    size={SIZE_S}
                    title="Wiederholen"
                    disabled={!document.canRun(redo)}
                    onClick={() => document.run(redo)}
                />
            </div>
            <SelectInput
                options={blockType ? BLOCK_TYPES : [{ value: '', label: '—' }, ...BLOCK_TYPES]}
                value={blockType ?? ''}
                onChange={(type) => document.run(setCurrentBlockType(type as BlockType))}
            />
            <div className={clsx(styles.group)}>
                {MARK_BUTTONS.map(({ mark, icon, title, command }) => (
                    <Button
                        key={mark.name}
                        icon={icon}
                        size={SIZE_S}
                        title={title}
                        active={document.isMarkActive(mark)}
                        disabled={!document.canRun(command)}
                        onClick={() => document.run(command)}
                    />
                ))}
                <LinkButton document={document} />
            </div>
            <div className={clsx(styles.group)}>
                <Button
                    icon={mdiFormatListBulleted}
                    size={SIZE_S}
                    title="Aufzählung"
                    active={document.isInside(schema.nodes.bullet_list)}
                    onClick={() => document.run(toggleList(schema.nodes.bullet_list))}
                />
                <Button
                    icon={mdiFormatListNumbered}
                    size={SIZE_S}
                    title="Nummerierte Liste"
                    active={document.isInside(schema.nodes.ordered_list)}
                    onClick={() => document.run(toggleList(schema.nodes.ordered_list))}
                />
                <Button
                    icon={mdiFormatQuoteClose}
                    size={SIZE_S}
                    title="Zitat"
                    active={document.isInside(schema.nodes.blockquote)}
                    onClick={() => document.run(toggleBlockquote)}
                />
            </div>
            <InsertMenu document={document} />
            {document.isInside(schema.nodes.table) && <TableActions document={document} />}
        </>
    );
});

const Toolbar = observer(({ document }: Props) => {
    return (
        <div className={clsx(styles.toolbar)}>
            <Actions file={document.file} />
            {!document.showDiff && <EditingTools document={document} />}
            <div className={clsx(styles.spacer)} />
            <Button
                icon={mdiFileCompare}
                size={SIZE_S}
                title={document.showDiff ? 'Zurück zum Editor' : 'Änderungen anzeigen'}
                text="Diff"
                iconSide="left"
                active={document.showDiff}
                disabled={!document.showDiff && !document.file.isDirty}
                onClick={() => document.setShowDiff(!document.showDiff)}
            />
            <Button
                icon={mdiCodeJson}
                size={SIZE_S}
                title="Markdown-Quelltext bearbeiten"
                onClick={() => {
                    document.flush();
                    document.file.setPreventMdxEditor(true);
                }}
            />
        </div>
    );
});

export default Toolbar;
