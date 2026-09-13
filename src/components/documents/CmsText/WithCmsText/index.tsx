import useIsBrowser from '@docusaurus/useIsBrowser';
import { CmsTextContext, useFirstCmsTextDocumentIfExists } from '@tdev-components/documents/CmsText/shared';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import CmsActions from '../CmsActions';
import styles from './styles.module.scss';

export type Name = string & { __nameBrand: 'Name' };
export type DocumentRootId = string & { __nameBrand: 'DocumentRootId' };

export type CmsTextEntries = { [key: Name]: DocumentRootId };

interface Props {
    entries: CmsTextEntries;
    hideActions?: boolean;
    children?: React.ReactNode;
    mode?: 'xlsx' | 'code';
}

const WithCmsText = observer((props: Props) => {
    const { entries, hideActions, children } = props;
    const isBrowser = useIsBrowser();
    const allDocumentsAvailable = Object.values(entries)
        .map((documentRootId) => !!useFirstCmsTextDocumentIfExists(documentRootId))
        .every(Boolean);
    if (!isBrowser) {
        return null;
    }

    return allDocumentsAvailable ? (
        <CmsTextContext.Provider value={{ entries }}>
            {!hideActions && (
                <CmsActions
                    entries={entries}
                    className={clsx(styles.actions, 'shadow--lw')}
                    mode={props.mode}
                />
            )}
            {children}
        </CmsTextContext.Provider>
    ) : (
        <>
            {!hideActions && (
                <CmsActions
                    entries={entries}
                    className={clsx(styles.actions, 'shadow--lw')}
                    mode={props.mode}
                />
            )}
        </>
    );
});

export default WithCmsText;
