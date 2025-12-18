import * as React from 'react';
import { observer } from 'mobx-react-lite';
import QuillV2 from '@tdev-components/documents/QuillV2';
import String from '@tdev-components/documents/String';
import TaskState from '@tdev-components/documents/TaskState';
import ProgressState from '@tdev-components/documents/ProgressState';
import { DocumentType } from '@tdev-api/document';

interface Props {
    id: string;
    type: DocumentType | 'text' | 'state' | 'progress';
    pagePosition?: number;
}

type AnswerProps = Props &
    (
        | React.ComponentProps<typeof QuillV2>
        | React.ComponentProps<typeof String>
        | React.ComponentProps<typeof TaskState>
        | React.ComponentProps<typeof ProgressState>
    );

const Answer = observer((props: AnswerProps) => {
    switch (props.type) {
        case 'text':
        case 'quill_v2':
            return <QuillV2 {...(props as React.ComponentProps<typeof QuillV2>)} />;
        case 'string':
            return (
                <String
                    {...(props as React.ComponentProps<typeof String>)}
                    type={
                        'inputType' in props ? (props.inputType as React.HTMLInputTypeAttribute) : undefined
                    }
                />
            );
        case 'progress':
        case 'progress_state':
            return <ProgressState {...(props as React.ComponentProps<typeof ProgressState>)} />;
        case 'state':
        case 'task_state':
            return <TaskState {...props} />;
    }
    return (
        <span className="badge badge--danger">
            Unbekannte Komponente <code>{props.type}</code>
        </span>
    );
});

export default Answer;
