import {
    ButtonOrDropdownButton,
    iconComponentFor$,
    insertDirective$,
    useCellValues,
    usePublisher,
    useTranslation
} from '@mdxeditor/editor';
import React from 'react';
import _ from 'es-toolkit/compat';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { ADMONITION_TYPES } from './AdmonitionTypeSelector/admonitionTypes';

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 *
 * @group Toolbar Components
 */
export const InsertAdmonition = observer(() => {
    const [editor] = useLexicalComposerContext();
    const insertDirective = usePublisher(insertDirective$);
    const [iconComponentFor] = useCellValues(iconComponentFor$);
    const t = useTranslation();

    const items = React.useMemo(() => {
        return ['details', 'def', ...ADMONITION_TYPES].sort().map((type) => ({
            value: type,
            label: _.capitalize(type)
        }));
    }, [t]);

    return (
        <ButtonOrDropdownButton
            title={t('toolbar.admonition', 'Insert Admonition')}
            onChoose={(admonitionName) => {
                editor.update(() => {
                    insertDirective({ type: 'containerDirective', name: admonitionName });
                });
            }}
            items={items}
        >
            {iconComponentFor('admonition')}
        </ButtonOrDropdownButton>
    );
});
