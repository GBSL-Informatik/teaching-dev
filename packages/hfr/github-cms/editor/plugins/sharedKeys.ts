import { toggleMark } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import type { Schema } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';

/** shared by the document and the nested caption editors, see `CaptionView` */
export const historyKeys: Record<string, Command> = {
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Mod-y': redo
};

export const markKeys = (schema: Schema): Record<string, Command> => ({
    'Mod-b': toggleMark(schema.marks.strong),
    'Mod-i': toggleMark(schema.marks.emphasis),
    'Mod-e': toggleMark(schema.marks.code),
    'Mod-u': toggleMark(schema.marks.box),
    'Mod-k': toggleMark(schema.marks.kbd)
});
