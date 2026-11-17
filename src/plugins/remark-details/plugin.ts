import type { BlockContent, Root, Text } from 'mdast';
import type { MdxJsxAttribute, MdxJsxFlowElement } from 'mdast-util-mdx';
import type { Plugin, Transformer } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * The Infima alert types, which color the details like an admonition.
 */
export type AlertType = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

/**
 * Maps a directive class (e.g. `.danger` or `.red`) to the alert type it colors the details with.
 * Same colors as the Docusaurus admonitions.
 */
export const DEFAULT_COLORS: Record<string, AlertType> = {
    primary: 'primary',
    secondary: 'secondary',
    success: 'success',
    info: 'info',
    warning: 'warning',
    danger: 'danger',
    note: 'secondary',
    tip: 'success',
    caution: 'warning',
    red: 'danger',
    orange: 'warning',
    green: 'success',
    blue: 'info',
    gray: 'secondary',
    grey: 'secondary'
};

// TODO: How to type this?
//       TS doesn't enforce that only keys of directiveNames can be used in
//       the classNames
export interface PluginOptions<T extends readonly string[] = readonly string[]> {
    directiveNames?: T;
    tagNames?: {
        details?: string;
        summary?: string;
    };
    /**
     * The default label is used as the summary title when no label is provided.
     */
    defaultLabel?: {
        [key in T[number] | 'details']?: string;
    };
    classNames?: {
        [key in T[number] | 'details' | 'summary']?: string;
    };
    /**
     * Additional directive classes coloring the details, merged with `DEFAULT_COLORS`.
     * @example { purple: 'primary' } // :::details[Title]{.purple}
     */
    colors?: Record<string, AlertType>;
}

const plugin: Plugin<PluginOptions[], Root> = function plugin(optionsInput = {}): Transformer<Root> {
    const TAG_NAMES = { details: 'details', summary: 'summary', ...optionsInput.tagNames };
    const DIRECTIVE_NAMES = new Set(['details', ...(optionsInput.directiveNames || [])]);
    const COLORS: Record<string, AlertType> = { ...DEFAULT_COLORS, ...optionsInput.colors };

    const toAlertClasses = (directiveClass?: string | null) => {
        if (!directiveClass) {
            return directiveClass;
        }
        return directiveClass
            .split(/\s+/)
            .map((name) => (Object.hasOwn(COLORS, name) ? `alert--${COLORS[name]}` : name))
            .join(' ');
    };
    const getClassNameAttribute = (tag: string, directiveClass?: string | null): MdxJsxAttribute[] => {
        const classNames = [(optionsInput.classNames || {})[tag], directiveClass].filter(Boolean) as string[];
        return classNames.length > 0
            ? [{ type: 'mdxJsxAttribute', name: 'className', value: classNames.join(' ') }]
            : [];
    };

    return async (ast, vfile) => {
        visit(ast, 'containerDirective', (node, idx, parent) => {
            if (!parent || !DIRECTIVE_NAMES.has(node.name)) {
                return;
            }
            const label = node.children.filter(
                (child) => (child.data as { directiveLabel: boolean })?.directiveLabel
            );
            const content = node.children.filter(
                (child) => !(child.data as { directiveLabel: boolean })?.directiveLabel
            );
            const children = [...content];
            const summaryTitle =
                label.length > 0
                    ? label
                    : optionsInput.defaultLabel?.[node.name]
                      ? [{ type: 'text', value: optionsInput.defaultLabel[node.name] } as Text]
                      : [];
            if (summaryTitle.length > 0) {
                children.splice(0, 0, {
                    type: 'mdxJsxFlowElement',
                    name: TAG_NAMES.summary,
                    attributes: [...getClassNameAttribute('summary')],
                    children: summaryTitle as BlockContent[]
                });
            }
            const directiveClass = toAlertClasses(node.attributes?.class);
            const attributes = [...getClassNameAttribute(node.name, directiveClass)];
            if (node.attributes?.open !== undefined) {
                attributes.push({ type: 'mdxJsxAttribute', name: 'open', value: 'true' });
            }
            const details = {
                type: 'mdxJsxFlowElement',
                name: TAG_NAMES.details,
                attributes: attributes,
                children: children
            } as MdxJsxFlowElement;
            parent.children.splice(idx || 0, 1, details);
        });
    };
};

export default plugin;
