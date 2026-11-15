import { insertInline } from '../commands';
import { searchIcons } from '../components/IconPicker/mdiIcons';
import { schema } from '../schema';
import type { SuggestionSource } from './types';

/** `:mdi[rob`: the icons matching the typed name, inserted as `:mdi[robot]` */
export const iconSource: SuggestionSource = {
    pattern: /(?<=^|\s):mdi\[([\w-]{0,40})$/,
    suggestions: (_state, query) => {
        return searchIcons(query).map((icon) => ({
            label: icon.name,
            icon: icon.path,
            command: insertInline(schema.nodes.text_directive.create({ name: 'mdi', label: icon.name }))
        }));
    }
};
