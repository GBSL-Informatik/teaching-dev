import {
    ButtonOrDropdownButton,
    iconComponentFor$,
    insertDirective$,
    useCellValues,
    usePublisher,
    useTranslation
} from '@mdxeditor/editor';
import React from 'react';
import { ADMONITION_TYPES } from '.';
import _ from 'lodash';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 *
 * @group Toolbar Components
 */
export const InsertAdmonition = () => {
    const [editor] = useLexicalComposerContext();
    const insertDirective = usePublisher(insertDirective$);
    const [iconComponentFor] = useCellValues(iconComponentFor$);
    const t = useTranslation();

    const items = React.useMemo(() => {
        return [...ADMONITION_TYPES, 'details'].map((type) => ({ value: type, label: _.capitalize(type) }));
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
};
