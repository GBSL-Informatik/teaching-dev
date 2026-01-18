import React from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import type CodeBlockType from '@theme/CodeBlock';
import type { WrapperProps } from '@docusaurus/types';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { CodeEditor } from '@tdev-components/documents/CodeEditor';
import { LiveCode } from '@tdev-stores/ComponentStore';

export interface MetaProps {
    id?: string;
    slim: boolean;
    readonly: boolean;
    noReset: boolean;
    noDownload: boolean;
    versioned: boolean;
    noHistory: boolean;
    noCompare: boolean;
    maxLines?: number;
    minLines?: number;
    hideWarning: boolean;
    title: string;
    live?: boolean;
    [key: LiveCode]: boolean;
}

type Props = WrapperProps<typeof CodeBlockType>;

export const sanitizedTitle = (title?: string) => {
    if (!title) {
        return;
    }
    return title
        .replace(/--/g, '<<HYPHEN>>')
        .replace(/__/g, '<<UNDERSCORE>>')
        .replace(/[-_]/g, ' ')
        .replace(/<<UNDERSCORE>>/g, '_')
        .replace(/<<HYPHEN>>/g, '-');
};

export const extractMetaProps = (props: { metastring?: string }): Partial<MetaProps> => {
    const metaString = (props?.metastring || '').replace(/\s*=\s*/g, '='); // remove spaces around =
    const metaRaw = metaString.split(/\s+/).map((s) => s.trim().split('='));
    return metaRaw.reduce(
        (acc, [key, value]) => {
            if (!key) {
                return acc;
            }
            /** casts to booleans and numbers. When no value was provided, true is used */
            const val =
                value === 'true'
                    ? true
                    : value === 'false'
                      ? false
                      : !Number.isNaN(Number(value))
                        ? Number(value)
                        : value || true;
            acc[key] = val;
            /**
             * special handling for live_jsx to be compatible with existing codeblocks
             * from docusaurus
             */
            if (key === 'live') {
                acc['live_jsx'] = val;
            }
            if (key.startsWith('live_')) {
                acc['live'] = true;
            }
            return acc;
        },
        {} as { [key: string]: number | string | boolean }
    ) as Partial<MetaProps>;
};

const SPLIT_CODE_REGEX = /^(?:(?<pre>.*?)\n###\s*PRE\s*)?(?<code>.*?)(?:\n###\s*POST\s*(?<post>.*))?$/s;

export const splitCode = (rawCode: string) => {
    const { pre, code, post } = rawCode.replace(/\s*\n$/, '').match(SPLIT_CODE_REGEX)?.groups || {};
    return {
        pre: pre || '',
        code: code || '',
        post: post || ''
    };
};

const CodeBlockWrapper = (props: Props & MetaProps): React.ReactNode => {
    const metaProps = extractMetaProps(props);
    const langMatch = ((props.className || '') as string).match(/language-(?<lang>\w*)/);
    let lang = props.language ?? langMatch?.groups?.lang?.toLocaleLowerCase() ?? '';
    if (lang === 'py') {
        lang = 'python';
    }
    // if (metaProps.live_jsx) {
    //     return <Playground scope={ReactLiveScope} {...props} />;
    // }
    if (metaProps.live) {
        const title = props.title || metaProps.title;
        const liveCodeType = Object.keys(metaProps).find((key) => key.startsWith('live_')) as
            | LiveCode
            | undefined;
        const { code, pre, post } = splitCode((props.children as string) || '');
        return (
            <BrowserOnly fallback={<CodeBlock language={lang}>{code}</CodeBlock>}>
                {() => {
                    return (
                        <CodeEditor
                            id={metaProps.id}
                            code={code}
                            lang={lang}
                            liveCodeType={liveCodeType}
                            preCode={pre}
                            postCode={post}
                            maxLines={metaProps.maxLines && Number.parseInt(`${metaProps.maxLines}`, 10)}
                            minLines={metaProps.minLines && Number.parseInt(`${metaProps.minLines}`, 10)}
                            readonly={!!metaProps.readonly}
                            noReset={!!metaProps.noReset}
                            noDownload={metaProps.versioned || !!metaProps.noDownload}
                            slim={!!metaProps.slim}
                            showLineNumbers={!(!!metaProps.slim && !/\n/.test(code))}
                            versioned={!!metaProps.versioned}
                            noHistory={!!metaProps.noHistory}
                            noCompare={!!metaProps.noCompare}
                            hideWarning={!!metaProps.hideWarning}
                            title={sanitizedTitle(title) || lang}
                            className={props.className}
                        />
                    );
                }}
            </BrowserOnly>
        );
    }
    return <CodeBlock {...props} />;
};
export default CodeBlockWrapper;
