// Import the original mapper
import Answer from '@tdev-components/Answer';
import DefBox from '@tdev-components/CodeDefBox';
import DefContent from '@tdev-components/CodeDefBox/DefContent';
import DefHeading from '@tdev-components/CodeDefBox/DefHeading';
import DefinitionList from '@tdev-components/DefinitionList';
import MdxComment from '@tdev-components/documents/MdxComment';
import QuillV2 from '@tdev-components/documents/QuillV2';
import Solution from '@tdev-components/documents/Solution';
import String from '@tdev-components/documents/String';
import TaskState from '@tdev-components/documents/TaskState';
import Figure from '@tdev-components/Figure';
import SourceRef from '@tdev-components/Figure/SourceRef';
import MdxPage from '@tdev-components/MdxPage';
import MDXComponents from '@theme-original/MDXComponents';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';

export default {
    // Re-use the default mapping
    ...MDXComponents,
    Dl: DefinitionList,
    Tabs: Tabs,
    TabItem: TabItem,
    DefBox: DefBox,
    DefHeading: DefHeading,
    DefContent: DefContent,
    Figure: Figure,
    String: String,
    SourceRef: SourceRef,
    Answer: Answer,
    QuillV2: QuillV2,
    Solution: Solution,
    TaskState: TaskState,
    MdxPage: MdxPage,
    MdxComment: MdxComment
};
