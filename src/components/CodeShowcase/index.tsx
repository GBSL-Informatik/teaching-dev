import React from 'react';
import { observer } from 'mobx-react-lite';
import CodeBlock from '@theme/CodeBlock';
import BrowserWindow from '@tdev-components/BrowserWindow';

interface Props {
    code: string;
    imports?: string[];
    children?: React.ReactNode;
    lang?: string;
    lineNumbers?: boolean;
    noBrowserWindow?: boolean;
    metastring?: string;
}

const CodeShowcase = observer((props: Props) => {
    const code = props.imports ? `${props.imports.join('\n')}\n\n${props.code}` : props.code;
    const lang = props.lang === undefined ? 'tsx' : props.lang;
    return (
        <>
            <CodeBlock language={lang} showLineNumbers={props.lineNumbers} metastring={props.metastring}>
                {code}
            </CodeBlock>
            {props.noBrowserWindow ? <>{props.children}</> : <BrowserWindow>{props.children}</BrowserWindow>}
        </>
    );
});

export default CodeShowcase;
