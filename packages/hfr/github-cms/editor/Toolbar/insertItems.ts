import {
    mdiApplicationOutline,
    mdiArrowExpandDown,
    mdiCardsOutline,
    mdiCardTextOutline,
    mdiCheckboxOutline,
    mdiCodeBraces,
    mdiEmoticonOutline,
    mdiFileDocumentEditOutline,
    mdiFormatListNumbered,
    mdiFormatPageBreak,
    mdiFormTextbox,
    mdiInformationOutline,
    mdiMathIntegral,
    mdiMathIntegralBox,
    mdiMinus,
    mdiProgressCheck,
    mdiTab,
    mdiTable,
    mdiViewColumnOutline,
    mdiViewGridOutline
} from '@mdi/js';
import type { Node } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { v4 as uuidv4 } from 'uuid';
import { createNode, createTable, insertBlock, insertInline } from '../commands';
import { isInDirectiveItem } from '../plugins/directiveItems';
import { type ImportSpec, withImport } from '../imports';
import { ADMONITION_TYPES } from '../nodeViews/ContainerDirective/admonitionTypes';
import { ITEMS_DIRECTIVES, type JsxAttribute, schema } from '../schema';

const { nodes } = schema;

interface MenuItemBase {
    label: string;
    icon: string;
    /** shown only where it makes sense, in addition to where the schema allows it */
    isAvailable?: (state: EditorState) => boolean;
    /** additional search terms of the quick actions, e.g. the markdown syntax */
    keywords?: string[];
    /** added to the imports of the document, unless the name is already imported */
    requiredImport?: ImportSpec;
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

const itemsDirective = (name: string) => {
    const item = createNode(nodes.directive_item, { explicitBreak: false }, paragraph());
    return createNode(nodes.items_directive, { name }, item);
};

/** a new `:::name` directive, with the content its remark plugin expects */
export const createContainerDirective = (name: string): Node => {
    if (name === 'details') {
        return directive('details', 'Details');
    }
    if (ITEMS_DIRECTIVES.includes(name)) {
        return itemsDirective(name);
    }
    return directive(name);
};

const jsx = (name: string, attributes: JsxAttribute[], children?: Node[]) => {
    if (!children) {
        return nodes.jsx_flow_void.create({ name, attributes });
    }
    return createNode(nodes.jsx_flow, { name, attributes }, children);
};

const orderedList = (items: string[]) => {
    const listItems = items.map((item) => createNode(nodes.list_item, null, paragraph(item)));
    return createNode(nodes.ordered_list, null, listItems);
};

const idAttribute = (): JsxAttribute => ({ type: 'attribute', name: 'id', value: uuidv4() });

/** the type can be changed in the admonition itself */
const DEFAULT_ADMONITION = ADMONITION_TYPES.includes('info') ? 'info' : ADMONITION_TYPES[0];

const admonitionItem = (type: string, label: string): MenuItem => ({
    label,
    icon: mdiInformationOutline,
    keywords: ['admonition', type],
    create: () => createContainerDirective(type)
});

/** offered by the quick actions only, the insert menu has a single admonition */
export const ADMONITION_ITEMS: MenuItem[] = ADMONITION_TYPES.filter(
    (type) => type !== DEFAULT_ADMONITION
).map((type) => admonitionItem(type, `Hinweis: ${type}`));

const BLOCKS: MenuItem[] = [
    admonitionItem(DEFAULT_ADMONITION, 'Hinweis'),
    { label: 'Tabelle', icon: mdiTable, keywords: ['table'], create: () => createTable(3, 3) },
    {
        label: 'Code',
        icon: mdiCodeBraces,
        keywords: ['```', 'codeblock'],
        create: () => nodes.code_block.create({ lang: 'py' })
    },
    {
        label: 'Mathe-Block',
        icon: mdiMathIntegralBox,
        keywords: ['$$', 'math', 'latex', 'formel'],
        create: () => nodes.math_block.create(null, schema.text('\\LaTeX'))
    },
    {
        label: 'Trennlinie',
        icon: mdiMinus,
        keywords: ['---', 'hr', 'linie'],
        create: () => nodes.thematic_break.create()
    },
    {
        label: 'Details',
        icon: mdiArrowExpandDown,
        keywords: ['aufklappen', 'collapse'],
        create: () => createContainerDirective('details')
    },
    {
        label: 'Karten',
        icon: mdiCardsOutline,
        keywords: ['cards'],
        create: () => createContainerDirective('cards')
    },
    {
        label: 'Spalten',
        icon: mdiViewColumnOutline,
        keywords: ['flex', 'columns'],
        create: () => createContainerDirective('flex')
    },
    {
        label: 'Nächste Karte/Spalte (::br, Strg+Enter)',
        icon: mdiFormatPageBreak,
        keywords: ['br'],
        create: () => createNode(nodes.directive_item, null),
        isAvailable: isInDirectiveItem
    }
];

const INLINE: MenuItem[] = [
    {
        label: 'Mathe',
        icon: mdiMathIntegral,
        keywords: ['$', 'math', 'latex', 'formel'],
        create: () => nodes.math_inline.create({ value: '\\LaTeX' }),
        inline: true
    },
    {
        label: 'Icon',
        icon: mdiEmoticonOutline,
        keywords: ['mdi', 'emoji'],
        create: () => nodes.text_directive.create({ name: 'mdi', label: 'robot' }),
        inline: true
    }
];

const COMPONENTS: MenuItem[] = [
    {
        label: 'Antwort (Text)',
        keywords: ['answer'],
        icon: mdiCardTextOutline,
        create: () => jsx('Answer', [{ type: 'attribute', name: 'type', value: 'text' }, idAttribute()])
    },
    {
        label: 'Antwort (Zeile)',
        keywords: ['answer'],
        icon: mdiFormTextbox,
        create: () => jsx('Answer', [{ type: 'attribute', name: 'type', value: 'string' }, idAttribute()])
    },
    {
        label: 'Antwort (Status)',
        keywords: ['answer'],
        icon: mdiCheckboxOutline,
        create: () => jsx('Answer', [{ type: 'attribute', name: 'type', value: 'state' }, idAttribute()])
    },
    {
        label: 'Aufgabenstatus',
        icon: mdiProgressCheck,
        keywords: ['taskstate'],
        create: () => jsx('TaskState', [idAttribute()])
    },
    {
        label: 'Lösung',
        keywords: ['solution'],
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
    },
    {
        label: 'Browser-Fenster',
        keywords: ['browserwindow'],
        icon: mdiApplicationOutline,
        create: () => jsx('BrowserWindow', [], [paragraph('Inhalt')]),
        requiredImport: { name: 'BrowserWindow', source: '@tdev-components/BrowserWindow' }
    },
    {
        label: 'Schritte',
        keywords: ['steps', 'anleitung'],
        icon: mdiFormatListNumbered,
        create: () => jsx('Steps', [], [orderedList(['Schritt 1', 'Schritt 2'])]),
        requiredImport: { name: 'Steps', source: '@tdev-components/Steps' }
    },
    {
        label: 'Unterseiten (Karten)',
        keywords: ['doccardlist'],
        icon: mdiViewGridOutline,
        create: () => jsx('DocCardList', []),
        requiredImport: { name: 'DocCardList', source: '@theme/DocCardList' }
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

/** the items of all sections */
export const INSERT_ITEMS: MenuItem[] = INSERT_SECTIONS.flatMap((section) => section.items);

/** inserts the item, the content is created anew on each call */
export const insertCommand = (item: MenuItem): Command => {
    return (state, dispatch, view) => {
        if (item.isAvailable && !item.isAvailable(state)) {
            return false;
        }
        const insert = item.inline ? insertInline(item.create()) : insertBlock(item.create());
        const command = item.requiredImport ? withImport(insert, item.requiredImport) : insert;
        return command(state, dispatch, view);
    };
};

/** the sections of the insert menu, with the items that can be inserted at the selection */
export const availableInsertSections = (state: EditorState): MenuSection[] => {
    return INSERT_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => insertCommand(item)(state))
    })).filter((section) => section.items.length > 0);
};
