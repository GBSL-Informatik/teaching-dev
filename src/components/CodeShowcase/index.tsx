import React from 'react';
import { observer } from 'mobx-react-lite';
import CodeBlock from '@theme/CodeBlock';
import BrowserWindow from '@tdev-components/BrowserWindow';
import Details from '@theme/Details';

interface Props {
    code: string;
    imports?: string[];
    children?: React.ReactNode;
    lang?: string;
    lineNumbers?: boolean;
    noBrowserWindow?: boolean;
    metastring?: string;
    collapseCode?: boolean;
    noCode?: boolean;
    windowProps?: Partial<React.ComponentProps<typeof BrowserWindow>>;
}

const CodeWrapper = (props: Props) => {
    const code = props.imports ? `${props.imports.join('\n')}\n\n${props.code}` : props.code;
    const lang = props.lang === undefined ? 'tsx' : props.lang;
    if (!props.collapseCode) {
        return (
            <CodeBlock language={lang} showLineNumbers={props.lineNumbers} metastring={props.metastring}>
                {code}
            </CodeBlock>
        );
    }
    return (
        <Details summary="Sourcecode">
            <CodeBlock language={lang} showLineNumbers={props.lineNumbers} metastring={props.metastring}>
                {code}
            </CodeBlock>
        </Details>
    );
};

const CodeShowcase = observer((props: Props) => {
    return (
        <>
            {props.noCode ? null : <CodeWrapper {...props} />}
            {props.noBrowserWindow ? (
                <>{props.children}</>
            ) : (
                <BrowserWindow {...props.windowProps}>{props.children}</BrowserWindow>
            )}
        </>
    );
});

export default CodeShowcase;
