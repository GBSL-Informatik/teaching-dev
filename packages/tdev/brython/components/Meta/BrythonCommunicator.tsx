import * as React from 'react';
import { BRYTHON_NOTIFICATION_EVENT, DOM_ELEMENT_IDS } from '@tdev-components/documents/CodeEditor/constants';
import { observer } from 'mobx-react-lite';
import Script, { type LogMessage } from '@tdev-models/documents/Script';

interface Props {
    script: Script;
}

const BrythonCommunicator = observer((props: Props) => {
    const { script } = props;
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
                        script.clearLogMessages();
                        script.setExecuting(true);
                        break;
                    case 'done':
                        const isRunning = current.getAttribute('data--is-running');
                        if (isRunning) {
                            return;
                        }
                        script.setExecuting(false);
                        break;
                    default:
                        script.addLogMessage({
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
    }, [ref, script]);

    if (!script || script.lang !== 'python') {
        return null;
    }

    return <div id={DOM_ELEMENT_IDS.communicator(script.codeId)} ref={ref}></div>;
});

export default BrythonCommunicator;
