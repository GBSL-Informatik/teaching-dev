import { Document as DocumentProps } from '@tdev-api/document';
import ChoiceAnswer, { ModelMeta as ChoiceAnswerMeta } from '@tdev-models/documents/Assessable/ChoiceAnswer';
import Quiz, { ModelMeta as QuizMeta } from '@tdev-models/documents/Assessable/Quiz';
import TrueFalseAnswer, {
    ModelMeta as TrueFalseAnswerMeta
} from '@tdev-models/documents/Assessable/TrueFalseAnswer';
import CmsText, { CmsTextMeta } from '@tdev-models/documents/CmsText';
import Code, { CodeMeta } from '@tdev-models/documents/Code';
import DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import MdxComment, { ModelMeta as MdxCommentMeta } from '@tdev-models/documents/MdxComment';
import ProgressState, { ModelMeta as ProgressStateMeta } from '@tdev-models/documents/ProgressState';
import QuillV2, { ModelMeta as QuillV2Meta } from '@tdev-models/documents/QuillV2';
import Restricted, { ModelMeta as RestrictedMeta } from '@tdev-models/documents/Restricted';
import ScriptVersion from '@tdev-models/documents/ScriptVersion';
import Solution, { ModelMeta as SolutionMeta } from '@tdev-models/documents/Solution';
import String, { ModelMeta as StringMeta } from '@tdev-models/documents/String';
import TaskState, { TaskMeta as TaskStateMeta } from '@tdev-models/documents/TaskState';
import type { AnyDocumentTypeConfig } from '@tdev-stores/DocumentStore';
import { DefaultExtensions } from './FileExtensions';

/**
 * The document types of the core. Packages add theirs with `documentStore.registerDocumentType`.
 */
export const BuiltinDocumentTypes: AnyDocumentTypeConfig[] = [
    {
        type: 'code',
        factory: (data, store) => new Code(data, store),
        defaultMeta: new CodeMeta({}),
        fileExtensions: DefaultExtensions.code
    },
    {
        type: 'task_state',
        factory: (data, store) => new TaskState(data, store),
        defaultMeta: new TaskStateMeta({}),
        taskable: true
    },
    {
        type: 'progress_state',
        factory: (data, store) => new ProgressState(data, store),
        defaultMeta: new ProgressStateMeta({}),
        taskable: true
    },
    {
        type: 'script_version',
        factory: (data, store) => new ScriptVersion(data, store)
    },
    {
        type: 'string',
        factory: (data, store) => new String(data, store),
        defaultMeta: new StringMeta({})
    },
    {
        type: 'choice_answer',
        factory: (data, store) => new ChoiceAnswer(data, store),
        defaultMeta: new ChoiceAnswerMeta({ optionsCount: 0 }),
        taskable: true
    },
    {
        type: 'quiz',
        factory: (data, store) => new Quiz(data, store),
        defaultMeta: new QuizMeta({}),
        taskable: true
    },
    {
        type: 'true_false_answer',
        factory: (data, store) => new TrueFalseAnswer(data, store),
        defaultMeta: new TrueFalseAnswerMeta({}),
        taskable: true
    },
    {
        type: 'quill_v2',
        factory: (data, store) => new QuillV2(data, store),
        defaultMeta: new QuillV2Meta({}),
        fileExtensions: DefaultExtensions.quill_v2
    },
    {
        type: 'solution',
        factory: (data, store) => new Solution(data, store),
        defaultMeta: new SolutionMeta({})
    },
    {
        type: 'dir',
        factory: (data, store) => new Directory(data, store),
        createOnNewRecord: true
    },
    {
        type: 'file',
        factory: (data, store) => new File(data, store),
        createOnNewRecord: true
    },
    {
        type: 'mdx_comment',
        factory: (data, store) => new MdxComment(data, store),
        defaultMeta: new MdxCommentMeta({}),
        createOnNewRecord: true
    },
    {
        type: 'restricted',
        factory: (data, store) => new Restricted(data, store),
        defaultMeta: new RestrictedMeta({})
    },
    {
        type: 'cms_text',
        factory: (data, store) => new CmsText(data, store),
        defaultMeta: new CmsTextMeta({})
    },
    {
        type: 'dynamic_document_roots',
        factory: (data, store) => new DynamicDocumentRoots(data as DocumentProps<any>, store),
        createOnNewRecord: true
    }
];
