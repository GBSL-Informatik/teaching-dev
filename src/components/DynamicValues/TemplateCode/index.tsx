import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import CodeBlock from '@theme/CodeBlock';
import { templateReplacer } from '../templateReplacer';
import { CodeAttributes } from '@tdev-plugins/remark-code-as-attribute/plugin';

interface Props {
    children?: React.ReactNode;
    code?: string;
    codeAttributes?: CodeAttributes;
}

const TemplateCode = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const { current } = pageStore;
    if (!current) {
        return null;
    }
    const code = templateReplacer(props.code, pageStore.current?.dynamicValues);
    const metastring = templateReplacer(props.codeAttributes?.meta, pageStore.current?.dynamicValues);
    return (
        <CodeBlock language={props.codeAttributes?.lang} metastring={metastring}>
            {code}
        </CodeBlock>
    );
});

export default TemplateCode;
