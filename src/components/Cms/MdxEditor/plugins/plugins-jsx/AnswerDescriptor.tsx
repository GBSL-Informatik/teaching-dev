import React from 'react';
import { JsxComponentDescriptor, JsxPropertyDescriptor } from '@mdxeditor/editor';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiCardTextOutline, mdiCheckboxOutline, mdiFormTextbox, mdiInvoiceTextSendOutline } from '@mdi/js';
import GenericAttributeEditor, {
    GenericPropery
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import Card from '@tdev-components/shared/Card';
import { DocumentType } from '@tdev-api/document';
import { useAttributeEditorInNestedEditor } from '@tdev-components/Cms/MdxEditor/hooks/useAttributeEditorInNestedEditor';
import Answer from '@tdev-components/Answer';
import { v4 as uuidv4 } from 'uuid';

const BaseProps: GenericPropery[] = [
    { name: 'id', type: 'text', required: true, placeholder: 'id', generateNewValue: () => uuidv4() },
    {
        name: 'type',
        type: 'select',
        required: true,
        options: ['text', DocumentType.String, 'state'],
        saveOnChange: true
    },
    { name: 'readonly', type: 'checkbox' },
    { name: 'hideWarning', type: 'checkbox', description: 'Versteckt die Warnung' }
];

const TaskStateProps: GenericPropery[] = [
    {
        name: 'states',
        type: 'multi-select',
        options: ['unset', 'question', 'checked', 'star-empty', 'star-half', 'star']
    },
    { name: 'label', type: 'text' }
];
const StringProps: GenericPropery[] = [
    { name: 'label', type: 'text', description: 'Beschriftung' },
    { name: 'placeholder', type: 'text', description: 'Platzhalter' },
    { name: 'default', type: 'text', description: 'Standardwert' },
    { name: 'solution', type: 'text', description: 'Lösung' },
    {
        name: 'sanitier',
        type: 'expression',
        description: 'Sanitierfunktion die auf die Lösung angewandt wird.',
        placeholder: `(val) => val.toLowerCase().replaceAll(' ', '')`,
        lang: 'javascript'
    },
    {
        name: 'labelWidth',
        type: 'text',
        description: 'Breite des Labels',
        placeholder: '12em'
    },
    {
        name: 'inputType',
        type: 'select',
        options: [
            'text',
            'number',
            'range',
            'password',
            'search',
            'radio',
            'color',
            'email',
            'tel',
            'url',
            'date',
            'time',
            'week',
            'datetime-local'
        ]
    },
    {
        name: 'inline',
        type: 'checkbox',
        description: 'Verwendet <span> statt <div>'
    },
    {
        name: 'fullWidth',
        type: 'checkbox',
        description: 'Verwendet die volle Breite'
    },
    {
        name: 'stateIconsPosition',
        type: 'select',
        options: ['inside', 'outside', 'none']
    }
];

const QuillV2Props: GenericPropery[] = [
    { name: 'hideToolbar', type: 'checkbox' },
    { name: 'theme', type: 'select', options: ['snow', 'bubble'] }
];

const IconMap: { [key: string]: string } = {
    [DocumentType.String]: mdiFormTextbox,
    [DocumentType.QuillV2]: mdiCardTextOutline,
    text: mdiCardTextOutline,
    state: mdiCheckboxOutline,
    [DocumentType.TaskState]: mdiCheckboxOutline,
    default: mdiInvoiceTextSendOutline
};

const getAnswerAttributes = (type: string) => {
    switch (type) {
        case DocumentType.QuillV2:
        case 'text':
            return [...BaseProps, ...QuillV2Props];
        case DocumentType.String:
            return [...BaseProps, ...StringProps];
        case 'state':
        case DocumentType.TaskState:
            return [...BaseProps, ...TaskStateProps];
        default:
            return BaseProps;
    }
};

const AnswerDescriptor: JsxComponentDescriptor = {
    name: 'Answer',
    source: undefined,
    kind: 'flow',
    hasChildren: false,
    props: BaseProps as JsxPropertyDescriptor[],
    Editor: ({ descriptor, mdastNode }) => {
        const answerType = mdastNode.attributes.find(
            (attr) =>
                attr.type === 'mdxJsxAttribute' && attr.name === 'type' && typeof attr.value === 'string'
        )?.value as 'text' | DocumentType | 'state';
        const answerAttributes = React.useMemo(() => {
            console.log('recalc');
            return getAnswerAttributes(answerType);
        }, [answerType]);
        const { onUpdate, values } = useAttributeEditorInNestedEditor(answerAttributes, mdastNode.attributes);

        return (
            <Card classNames={{ card: styles.answerCard, body: clsx(styles.answerBody) }}>
                <div className={clsx(styles.answer)} key={answerType}>
                    <Answer {...values} type={answerType} readonly id="" hideApiState hideWarning />
                </div>
                <GenericAttributeEditor
                    properties={answerAttributes}
                    onUpdate={onUpdate}
                    values={values}
                    canExtend
                />
                <RemoveNode />
            </Card>
        );
    }
};
export default AnswerDescriptor;
