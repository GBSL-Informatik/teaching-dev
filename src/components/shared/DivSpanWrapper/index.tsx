import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

interface Props {
    inline?: boolean;
    className?: string;
    children: React.ReactNode;
}

const DivSpanWrapper = observer((props: Props) => {
    const { inline, children, className } = props;
    if (inline) {
        return <span className={clsx(className)}>{children}</span>;
    }
    return <div className={clsx(className)}>{children}</div>;
});

export default DivSpanWrapper;
