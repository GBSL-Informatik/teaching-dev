// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import DefinitionList from '@tdev-components/DefinitionList';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import DefBox from '@tdev-components/CodeDefBox';
import DefHeading from '@tdev-components/CodeDefBox/DefHeading';
import DefContent from '@tdev-components/CodeDefBox/DefContent';
import Figure from '@tdev-components/Figure';
import SourceRef from '@tdev-components/Figure/SourceRef';
import Answer from '@tdev-components/Answer';
import Solution from '@tdev-components/documents/Solution';
import MdxComment from '@tdev-components/documents/MdxComment';
import MdxPage from '@tdev-components/MdxPage';
import QuillV2 from '@tdev-components/documents/QuillV2';
import TaskState from '@tdev-components/documents/TaskState';

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
