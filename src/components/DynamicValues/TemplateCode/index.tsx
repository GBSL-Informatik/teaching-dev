import { useStore } from '@tdev-hooks/useStore';
import { CodeAttributes } from '@tdev-plugins/remark-code-as-attribute/plugin';
import CodeBlock from '@theme/CodeBlock';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { templateReplacer } from '../templateReplacer';

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
    const code = templateReplacer(props.code, current.dynamicValues);
    const metastring = templateReplacer(props.codeAttributes?.meta, current.dynamicValues);
    return (
        <CodeBlock language={props.codeAttributes?.lang} metastring={metastring}>
            {code}
        </CodeBlock>
    );
});

export default TemplateCode;
