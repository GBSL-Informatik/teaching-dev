import React from 'react';
import Layout from '@theme/Layout';
import { unzip } from 'fflate';
import { XMLParser } from 'fast-xml-parser';
import CodeBlock from '@theme/CodeBlock';
import { visit } from '@tdev/docx-grader';
import { languageExtractor, textExtractor } from '@tdev/docx-grader/extractors';

const unzipFile = (file: File): Promise<{ [path: string]: Uint8Array }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const buffer = new Uint8Array(reader.result as ArrayBuffer);
            unzip(buffer, (err, unzipped) => {
                if (err) reject(err);
                else resolve(unzipped);
            });
        };
        reader.readAsArrayBuffer(file);
    });
};

const parseXmlFiles = (unzipped: { [path: string]: Uint8Array }) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        attributesGroupName: 'attributes',
        textNodeName: '#text',
        alwaysCreateTextNode: true,
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: false,
        allowBooleanAttributes: true
    });

    const xmlFiles: { [path: string]: any } = {};

    Object.entries(unzipped).forEach(([path, data]) => {
        if (path.endsWith('.xml') || path.endsWith('.rels')) {
            try {
                const xmlString = new TextDecoder('utf-8').decode(data);
                xmlFiles[path] = parser.parse(xmlString);
            } catch (err) {
                console.warn(`Failed to parse XML file ${path}:`, err);
            }
        } else {
            xmlFiles[path] = data; // Keep non-XML files as Uint8Array
        }
    });

    return xmlFiles;
};

export default function Home(): React.ReactNode {
    const [parsedFiles, setParsedFiles] = React.useState<{ [path: string]: any } | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [shownFile, setShownFiles] = React.useState<string>('');
    const [plainText, setPlainText] = React.useState<string>('');

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.docx') && !file.name.endsWith('.odt')) {
            setError('Please select a .docx file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const unzipped = await unzipFile(file);
            const parsed = parseXmlFiles(unzipped);
            setParsedFiles(parsed);
            setShownFiles('word/document.xml');
        } catch (err) {
            setError('Failed to process file: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const parsed = parsedFiles?.[shownFile];
        if (!parsed) {
            setPlainText('');
            return;
        }
        setPlainText(textExtractor(parsed));
        console.log(languageExtractor(parsed));
    }, [shownFile]);

    return (
        <Layout description="DOCX">
            <main>
                <h1>DOCX</h1>
                <div style={{ padding: '20px', margin: '0 20px' }}>
                    <h1>Word Document Reader</h1>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="file"
                            accept=".docx,.odt"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                    </div>

                    {loading && <p>Loading document...</p>}

                    {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                    {parsedFiles && (
                        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                            <h3>Document Parsed Successfully</h3>
                            <p>Found {Object.keys(parsedFiles).length} files</p>
                            <details>
                                <summary>File Structure</summary>
                                {Object.keys(parsedFiles)
                                    .filter((f) => f.endsWith('xml'))
                                    .map((filePath) => (
                                        <div key={filePath} style={{ margin: '5px 0' }}>
                                            <button
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: shownFile === filePath ? 'blue' : 'black',
                                                    cursor: 'pointer',
                                                    textDecoration:
                                                        shownFile === filePath ? 'underline' : 'none'
                                                }}
                                                onClick={() => setShownFiles(filePath)}
                                            >
                                                {filePath}
                                            </button>
                                        </div>
                                    ))}
                            </details>
                            <CodeBlock language="text" title="Plain Text">
                                {plainText}
                            </CodeBlock>
                            {parsedFiles[shownFile] && (
                                <CodeBlock language="json" title={shownFile}>
                                    {JSON.stringify(parsedFiles[shownFile] || {}, null, 2)}
                                </CodeBlock>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </Layout>
    );
}
