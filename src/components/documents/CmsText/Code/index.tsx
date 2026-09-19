import useIsBrowser from '@docusaurus/useIsBrowser';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import { useStore } from '@tdev-hooks/useStore';
import CodeBlock, { Props as CodeBlockProps } from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Props as DefaultCmsProps } from '..';
import CmsActions from '../CmsActions';
import { CmsTextEntries } from '../WithCmsText';
import styles from './styles.module.scss';

interface Props extends DefaultCmsProps {
    codeBlockProps?: CodeBlockProps;
}

const CmsCode = observer((props: Props) => {
    const { id, name, showActions } = props;
    const userStore = useStore('userStore');
    const contextId = name ? React.useContext(CmsTextContext)?.entries[name] : undefined;
    const documentRootId = id || contextId;
    const cmsText = useFirstCmsTextDocumentIfExists(documentRootId);
    const isBrowser = useIsBrowser();
    const actionEntries =
        showActions && documentRootId ? ({ [documentRootId]: documentRootId } as CmsTextEntries) : undefined;
    if (!isBrowser) {
        return null;
    }
    if (!cmsText || (!cmsText.canDisplay && !userStore.isUserSwitched)) {
        return actionEntries ? (
            <CmsActions entries={actionEntries} className={clsx(styles.codeBlock)} mode="code" />
        ) : null;
    }
    if (actionEntries) {
        return (
            <div className={clsx(styles.container, props.codeBlockProps?.title && styles.withTitle)}>
                <CmsActions entries={actionEntries} className={clsx(styles.codeBlock)} mode="code" />
                <CodeBlock {...(props.codeBlockProps || {})}>{cmsText.text}</CodeBlock>
            </div>
        );
    }

    return <CodeBlock {...(props.codeBlockProps || {})}>{cmsText.text}</CodeBlock>;
});

export default CmsCode;
