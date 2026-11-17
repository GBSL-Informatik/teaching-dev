import { SelfCheckContext } from './context';

interface Props {
    solutionId: string;
    taskStateId: string;
    children?: React.ReactNode;
}

const SelfCheck = ({ solutionId, taskStateId, children }: Props) => {
    return (
        <SelfCheckContext.Provider value={{ solutionId, taskStateId }}>{children}</SelfCheckContext.Provider>
    );
};

export default SelfCheck;
