import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

export const Comp = observer(() => {
    const documentRootStore = useStore('documentRootStore');
    const pageStore = useStore('pageStore');

    return (
        <div>
            <CodeBlock language="json">
                {JSON.stringify(
                    pageStore.pages
                        .filter((p) => p.editingStateV2.length)
                        .map((p) => [
                            p.id,
                            p.path,
                            [
                                ...p.editingStateV2.map(
                                    (s) =>
                                        `${s.type}:${s.isDone}->${p.documentRootConfigs.get(s.documentRootId)?.position ?? '?'} ${s.documentRootId}::${s.id}`
                                )
                            ]
                        ]),
                    null,
                    2
                )}
            </CodeBlock>
            <CodeBlock language="json">
                {JSON.stringify(
                    documentRootStore.documentRoots.map((d) => [
                        d.id,
                        d.mainDocuments.map((d) => d.type),
                        [...d.pagePositions.entries()]
                    ]),
                    null,
                    2
                )}
            </CodeBlock>
            <CodeBlock language="json">
                {JSON.stringify(documentRootStore.defaultMetas.map((m) => m.type))}
            </CodeBlock>
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
