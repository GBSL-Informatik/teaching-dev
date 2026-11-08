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
    mdiLightbulbOnOutline,
    mdiMathIntegral,
    mdiMathIntegralBox,
    mdiMinus,
    mdiProgressCheck,
    mdiTab,
    mdiTable,
    mdiViewColumnOutline
} from '@mdi/js';
import type { Node } from 'prosemirror-model';
import { v4 as uuidv4 } from 'uuid';
import { createNode, createTable } from '../commands';
import { ADMONITION_TYPES } from '../nodeViews/ContainerDirective/admonitionTypes';
import { type JsxAttribute, schema } from '../schema';

const { nodes } = schema;

interface MenuItemBase {
    label: string;
    icon: string;
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

const BLOCKS: MenuItem[] = [
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
        create: () => [itemBreak(), paragraph()]
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

const ADMONITIONS: MenuItem[] = ADMONITION_TYPES.map((name) => ({
    label: name,
    icon: name === 'tip' ? mdiLightbulbOnOutline : mdiInformationOutline,
    create: () => directive(name)
}));

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

/** the items of the insert menu, grouped in sections */
export const INSERT_SECTIONS: { title: string; items: MenuItem[] }[] = [
    { title: 'Blöcke', items: BLOCKS },
    { title: 'Inline', items: INLINE },
    { title: 'Hinweise', items: ADMONITIONS },
    { title: 'Komponenten', items: COMPONENTS }
];
