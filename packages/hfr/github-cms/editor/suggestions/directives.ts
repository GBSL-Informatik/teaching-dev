import { mdiCodeBrackets, mdiInformationOutline, mdiMinusBoxOutline, mdiTextBoxOutline } from '@mdi/js';
import { insertBlock, insertInline, insertText } from '../commands';
import { ADMONITION_TYPES } from '../nodeViews/ContainerDirective/admonitionTypes';
import { schema } from '../schema';
import { splitDirectiveItem } from '../plugins/directiveItems';
import { createContainerDirective } from '../Toolbar/insertItems';
import { CONTAINER_DIRECTIVES, LEAF_DIRECTIVES, TEXT_DIRECTIVES } from './directiveNames';
import { fuzzyFilter } from './fuzzyScore';
import type { Suggestion, SuggestionSource } from './types';

const { nodes } = schema;

const containerSuggestion = (name: string): Suggestion => ({
    label: `:::${name}`,
    icon: ADMONITION_TYPES.includes(name) ? mdiInformationOutline : mdiTextBoxOutline,
    command: (state, dispatch) => insertBlock(createContainerDirective(name))(state, dispatch)
});

const leafSuggestion = (name: string): Suggestion => ({
    label: `::${name}`,
    icon: mdiMinusBoxOutline,
    command: (state, dispatch) => {
        // `::br` starts the next item of `:::cards` or `:::flex`, it is not a node of its own
        if (name === 'br') {
            return splitDirectiveItem(state, dispatch);
        }
        return insertBlock(nodes.leaf_directive.create({ name }))(state, dispatch);
    }
});

/** `:mdi` continues with `:mdi[`, where the icon is chosen, see `iconSource` */
const textSuggestion = (name: string): Suggestion => ({
    label: `:${name}`,
    icon: mdiCodeBrackets,
    command: name === 'mdi' ? insertText(':mdi[') : insertInline(nodes.text_directive.create({ name }))
});

const directiveSource = (pattern: RegExp, suggestions: Suggestion[]): SuggestionSource => ({
    pattern,
    suggestions: (state, query) => {
        const matching = fuzzyFilter(suggestions, query, (suggestion) => [suggestion.label]);
        return matching.filter((suggestion) => suggestion.command(state));
    }
});

/** `:::tip` at the start of a textblock */
export const containerDirectiveSource = directiveSource(
    /^:::([\w-]{0,30})$/,
    [...ADMONITION_TYPES, ...CONTAINER_DIRECTIVES].map(containerSuggestion)
);

/** `::video` at the start of a textblock */
export const leafDirectiveSource = directiveSource(/^::([\w-]{0,30})$/, LEAF_DIRECTIVES.map(leafSuggestion));

/** `:mdi` at the start of the text or after a space */
export const textDirectiveSource = directiveSource(
    /(?<=^|\s):([a-z][\w-]{0,30})$/,
    TEXT_DIRECTIVES.map(textSuggestion)
);
