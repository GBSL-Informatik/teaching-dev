import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

export const Comp = observer(() => {
    const pageStore = useStore('pageStore');

    return (
        <div>
            <CodeBlock language="json">
                {JSON.stringify(
                    pageStore.pages
                        .filter((p) => p.taskableDocumentRootIds.length > 0)
                        .map((p) => ({
                            path: p.path,
                            rids: p.taskableDocumentRootIds,
                            docs: p.taskableDocuments.map((d) => d.id)
                        })),
                    null,
                    2
                )}
            </CodeBlock>
            <CodeBlock language="json">{JSON.stringify(pageStore.tree, null, 2)}</CodeBlock>;
        </div>
    );
});
