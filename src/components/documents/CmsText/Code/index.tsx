import { observer } from 'mobx-react-lite';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import React from 'react';
import CodeBlock, { Props as CodeBlockProps } from '@theme/CodeBlock';
import { Props as DefaultCmsProps } from '..';
import styles from './styles.module.scss';
import clsx from 'clsx';
import CmsActions from '../CmsActions';
import { CmsTextEntries } from '../WithCmsText';
import { useStore } from '@tdev-hooks/useStore';

interface Props extends DefaultCmsProps {
    codeBlockProps?: CodeBlockProps;
}

const CmsCode = observer((props: Props) => {
    const { id, name, showActions } = props;
    const userStore = useStore('userStore');
    const contextId = name ? React.useContext(CmsTextContext)?.entries[name] : undefined;
    const documentRootId = id || contextId;
    const cmsText = useFirstCmsTextDocumentIfExists(documentRootId);
    if (!cmsText || (!cmsText.canDisplay && !userStore.isUserSwitched)) {
        return showActions && documentRootId ? (
            <CmsActions entries={{ [documentRootId]: documentRootId } as CmsTextEntries} />
        ) : null;
    }
    if (showActions && documentRootId) {
        return (
            <div className={clsx(styles.container, props.codeBlockProps?.title && styles.withTitle)}>
                <CmsActions
                    entries={{ [documentRootId]: documentRootId } as CmsTextEntries}
                    className={clsx(styles.codeBlock)}
                />
                <CodeBlock {...(props.codeBlockProps || {})}>{cmsText.text}</CodeBlock>
            </div>
        );
    }

    return <CodeBlock {...(props.codeBlockProps || {})}>{cmsText.text}</CodeBlock>;
});

export default CmsCode;
