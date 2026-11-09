import {
    mdiArrowExpandDown,
    mdiCardsOutline,
    mdiCardTextOutline,
    mdiCheckboxOutline,
    mdiCodeBraces,
    mdiEmoticonOutline,
    mdiFileDocumentEditOutline,
    mdiFormatPageBreak,
    mdiFormTextbox,
    mdiInformationOutline,
    mdiMathIntegral,
    mdiMathIntegralBox,
    mdiMinus,
    mdiProgressCheck,
    mdiTab,
    mdiTable,
    mdiViewColumnOutline
} from '@mdi/js';
import type { Node } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { v4 as uuidv4 } from 'uuid';
import { createNode, createTable, insertBlock, insertInline } from '../commands';
import { ADMONITION_TYPES } from '../nodeViews/ContainerDirective/admonitionTypes';
import { type JsxAttribute, schema } from '../schema';

const { nodes } = schema;

interface MenuItemBase {
    label: string;
    icon: string;
    /** shown only where it makes sense, in addition to where the schema allows it */
    isAvailable?: (state: EditorState) => boolean;
}

/** the content is created when the item is chosen */
export type MenuItem =
    | (MenuItemBase & { inline: true; create: () => Node })
    | (MenuItemBase & { inline?: false; create: () => Node | Node[] });

const paragraph = (text?: string) => nodes.paragraph.create(null, text ? schema.text(text) : null);

const directive = (name: string, label?: string) => {
    const content = label
        ? [nodes.directive_label.create(null, schema.text(label)), paragraph()]
        : [paragraph()];
    return createNode(nodes.container_directive, { name }, content);
};

const itemBreak = () => nodes.leaf_directive.create({ name: 'br' });

const ITEMS_DIRECTIVES = ['cards', 'flex'];

const isInItemsDirective = (state: EditorState) => {
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type === nodes.container_directive && ITEMS_DIRECTIVES.includes(node.attrs.name)) {
            return true;
        }
    }
    return false;
};

/** `:::cards` or `:::flex`, the items are separated by `::br` */
const itemsDirective = (name: string, items: string[]) => {
    const content = items.flatMap((item, idx) => {
        const paragraphNode = paragraph(item);
        return idx === 0 ? [paragraphNode] : [itemBreak(), paragraphNode];
    });
    return createNode(nodes.container_directive, { name }, content);
};

const jsx = (name: string, attributes: JsxAttribute[], children?: Node[]) => {
    if (!children) {
        return nodes.jsx_flow_void.create({ name, attributes });
    }
    return createNode(nodes.jsx_flow, { name, attributes }, children);
};

const idAttribute = (): JsxAttribute => ({ type: 'attribute', name: 'id', value: uuidv4() });

/** the type can be changed in the admonition itself */
const DEFAULT_ADMONITION = ADMONITION_TYPES.includes('info') ? 'info' : ADMONITION_TYPES[0];

const BLOCKS: MenuItem[] = [
    { label: 'Hinweis', icon: mdiInformationOutline, create: () => directive(DEFAULT_ADMONITION) },
    { label: 'Tabelle', icon: mdiTable, create: () => createTable(3, 3) },
    { label: 'Code', icon: mdiCodeBraces, create: () => nodes.code_block.create({ lang: 'py' }) },
    {
        label: 'Mathe-Block',
        icon: mdiMathIntegralBox,
        create: () => nodes.math_block.create(null, schema.text('\\LaTeX'))
    },
    { label: 'Trennlinie', icon: mdiMinus, create: () => nodes.thematic_break.create() },
    { label: 'Details', icon: mdiArrowExpandDown, create: () => directive('details', 'Details') },
    { label: 'Karten', icon: mdiCardsOutline, create: () => itemsDirective('cards', ['Karte 1', 'Karte 2']) },
    {
        label: 'Spalten',
        icon: mdiViewColumnOutline,
        create: () => itemsDirective('flex', ['Spalte 1', 'Spalte 2'])
    },
    {
        label: 'Nächste Karte/Spalte (::br)',
        icon: mdiFormatPageBreak,
        create: () => [itemBreak(), paragraph()],
        isAvailable: isInItemsDirective
    }
];

const INLINE: MenuItem[] = [
    {
        label: 'Mathe',
        icon: mdiMathIntegral,
        create: () => nodes.math_inline.create({ value: '\\LaTeX' }),
        inline: true
    },
    {
        label: 'Icon',
        icon: mdiEmoticonOutline,
        create: () => nodes.text_directive.create({ name: 'mdi', label: 'robot' }),
        inline: true
    }
];

const COMPONENTS: MenuItem[] = [
    {
        label: 'Antwort (Text)',
        icon: mdiCardTextOutline,
        create: () => jsx('Answer', [{ type: 'attribute', name: 'type', value: 'text' }, idAttribute()])
    },
    {
        label: 'Antwort (Zeile)',
        icon: mdiFormTextbox,
        create: () => jsx('Answer', [{ type: 'attribute', name: 'type', value: 'string' }, idAttribute()])
    },
    {
        label: 'Antwort (Status)',
        icon: mdiCheckboxOutline,
        create: () => jsx('Answer', [{ type: 'attribute', name: 'type', value: 'state' }, idAttribute()])
    },
    { label: 'Aufgabenstatus', icon: mdiProgressCheck, create: () => jsx('TaskState', [idAttribute()]) },
    {
        label: 'Lösung',
        icon: mdiFileDocumentEditOutline,
        create: () => jsx('Solution', [idAttribute()], [paragraph('Lösung')])
    },
    {
        label: 'Tabs',
        icon: mdiTab,
        create: () =>
            jsx(
                'Tabs',
                [],
                [
                    jsx(
                        'TabItem',
                        [
                            { type: 'attribute', name: 'value', value: 'a' },
                            { type: 'attribute', name: 'label', value: 'A' }
                        ],
                        [paragraph('Inhalt')]
                    )
                ]
            )
    }
];

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const INSERT_SECTIONS: MenuSection[] = [
    { title: 'Blöcke', items: BLOCKS },
    { title: 'Inline', items: INLINE },
    { title: 'Komponenten', items: COMPONENTS }
];

export const insertCommand = (item: MenuItem): Command => {
    return item.inline ? insertInline(item.create()) : insertBlock(item.create());
};

const canInsert = (item: MenuItem, state: EditorState) => {
    const isAvailable = item.isAvailable?.(state) ?? true;
    return isAvailable && insertCommand(item)(state);
};

/** the sections of the insert menu, with the items that can be inserted at the selection */
export const availableInsertSections = (state: EditorState): MenuSection[] => {
    return INSERT_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => canInsert(item, state))
    })).filter((section) => section.items.length > 0);
};
