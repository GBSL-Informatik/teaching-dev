import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

export const Comp = observer(() => {
    const pageStore = useStore('pageStore');

    return <CodeBlock language="json">{JSON.stringify(pageStore.tree, null, 2)}</CodeBlock>;
});
