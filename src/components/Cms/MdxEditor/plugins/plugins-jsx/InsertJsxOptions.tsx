import {
    ButtonOrDropdownButton,
    insertJsx$,
    insertMarkdown$,
    usePublisher,
    insertDecoratorNode$,
    useCellValue,
    currentSelection$
} from '@mdxeditor/editor';
import React from 'react';
import {
    mdiApplicationOutline,
    mdiCardTextOutline,
    mdiCheckboxOutline,
    mdiDotsVerticalCircleOutline,
    mdiFormatListCheckbox,
    mdiFormTextbox,
    mdiInvoiceTextSendOutline,
    mdiMathIntegral,
    mdiMathIntegralBox,
    mdiQrcode,
    mdiQrcodeScan,
    mdiTextBox
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { v4 as uuidv4 } from 'uuid';

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 *
 * @group Toolbar Components
 */
export const InsertJsxElements = () => {
    const insertJsx = usePublisher(insertJsx$);
    const insertMdx = usePublisher(insertMarkdown$);
    const [editor] = useLexicalComposerContext();

    return (
        <>
            <ButtonOrDropdownButton
                items={[
                    {
                        label: <Button icon={mdiMathIntegral} text="Inline Math" iconSide="left" />,
                        value: 'InlineMath'
                    }
                ]}
                title="Inline Math Einfügen"
                onChoose={(value) => {
                    setTimeout(() => {
                        editor.update(() => {
                            insertMdx('$\\LaTeX$');
                        });
                    }, 0);
                }}
            >
                <Icon path={mdiMathIntegral} size={1} />
            </ButtonOrDropdownButton>
            <ButtonOrDropdownButton
                items={[
                    {
                        label: <Button icon={mdiFormatListCheckbox} text="DocCardList" iconSide="left" />,
                        value: 'DocCardList'
                    },
                    {
                        label: <Button icon={mdiApplicationOutline} text="BrowserWindow" iconSide="left" />,
                        value: 'BrowserWindow'
                    },
                    {
                        label: <Button icon={mdiMathIntegralBox} text="Math-Block" iconSide="left" />,
                        value: 'Math'
                    },
                    {
                        label: <Button icon={mdiFormTextbox} text="String Answer" iconSide="left" />,
                        value: 'StringAnswer'
                    },
                    {
                        label: <Button icon={mdiCardTextOutline} text="Text Answer" iconSide="left" />,
                        value: 'TextAnswer'
                    },
                    {
                        label: <Button icon={mdiCheckboxOutline} text="State Answer" iconSide="left" />,
                        value: 'StateAnswer'
                    },
                    {
                        label: <Button icon={mdiQrcode} text="QR Code" iconSide="left" />,
                        value: 'QrGenerator'
                    },
                    {
                        label: <Button icon={mdiQrcodeScan} text="QR Scanner" iconSide="left" />,
                        value: 'QrScanner'
                    }
                ]}
                title="Insert JSX Elements"
                onChoose={(value) => {
                    setTimeout(() => {
                        editor.update(() => {
                            switch (value) {
                                case 'DocCardList':
                                    insertJsx({
                                        name: 'DocCardList',
                                        kind: 'flow',
                                        props: {}
                                    });
                                    break;
                                case 'QrScanner':
                                    insertJsx({
                                        name: 'Scanner',
                                        kind: 'flow',
                                        props: {}
                                    });
                                    break;
                                case 'QrGenerator':
                                    insertJsx({
                                        name: 'Generator',
                                        kind: 'flow',
                                        props: {}
                                    });
                                    break;
                                case 'BrowserWindow':
                                    insertJsx({
                                        name: 'BrowserWindow',
                                        kind: 'flow',
                                        props: {}
                                    });
                                    break;
                                case 'TextAnswer':
                                case 'StateAnswer':
                                case 'StringAnswer':
                                    const answerType = value.replace('Answer', '').toLowerCase();
                                    insertJsx({
                                        name: 'Answer',
                                        kind: 'flow',
                                        props: { id: uuidv4(), type: answerType }
                                    });
                                    break;
                                case 'Math':
                                    insertMdx('$$\n\\LaTeX\n$$');
                                    break;
                            }
                        });
                    }, 1);
                }}
            >
                <Icon path={mdiDotsVerticalCircleOutline} size={1} />
            </ButtonOrDropdownButton>
        </>
    );
};
