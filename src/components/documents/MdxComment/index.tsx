import { MdxCommentData } from '@tdev-api/document';
import { useMdxComment } from '@tdev-hooks/useMdxComment';
import { observer } from 'mobx-react-lite';
import AddComment from './AddComment';
import { default as CommentComponent } from './Comment';

interface Props extends MdxCommentData {
    pageId: string;
}

const MdxComment = observer((props: Props) => {
    const comment = useMdxComment(props.pageId, props.nr, props.commentNr, props.type);
    if (!comment) {
        return <AddComment {...props} />;
    }
    return <CommentComponent comment={comment} />;
});

export default MdxComment;
