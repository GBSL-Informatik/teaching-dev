import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { BRYTHON_NOTIFICATION_EVENT, DOM_ELEMENT_IDS } from '@tdev/brython-code';
import Script, { LogMessage } from '@tdev/brython-code/models/Script';

interface Props {
    code: Script;
}

const BrythonCommunicator = observer((props: Props) => {
    const { code } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const { current } = ref;
        if (!current) {
            return;
        }
        const onBryNotify = (event: { detail?: LogMessage }) => {
            if (event.detail) {
                const data = event.detail as LogMessage;
                switch (data.type) {
                    case 'start':
                        code.clearLogMessages();
                        code.setExecuting(true);
                        break;
                    case 'done':
                        const isRunning = current.getAttribute('data--is-running');
                        if (isRunning) {
                            return;
                        }
                        code.setExecuting(false);
                        break;
                    default:
                        code.addLogMessage({
                            type: data.type,
                            output: data.output,
                            timeStamp: data.timeStamp
                        });
                        break;
                }
            }
        };
        current.addEventListener(BRYTHON_NOTIFICATION_EVENT, onBryNotify as EventListener);
        return () => {
            current.removeEventListener(BRYTHON_NOTIFICATION_EVENT, onBryNotify as EventListener);
        };
    }, [ref, code]);

    if (!code || code.lang !== 'python') {
        return null;
    }

    return <div id={DOM_ELEMENT_IDS.communicator(code.codeId)} ref={ref}></div>;
});

export default BrythonCommunicator;
