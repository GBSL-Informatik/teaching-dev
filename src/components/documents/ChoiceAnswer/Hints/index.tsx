import { mdiClose, mdiCloseCircleOutline, mdiInformationOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import ChoiceAnswerDocument, { ChoiceAnswerPoints } from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import styles from './styles.module.scss';

interface QuestionGradingHintProps {
    doc?: ChoiceAnswerDocument;
    questionIndex?: number;
}

export const QuestionGradingHint = observer(({ doc, questionIndex }: QuestionGradingHintProps) => {
    const ref = React.useRef<PopupActions>(null);

    if (!doc || questionIndex === undefined) {
        return;
    }

    const grading = doc?.gradings.get(questionIndex);
    if (!!grading?.points && !grading.points.gradingHint) {
        // This question has a grading but no grading hint, so we don't show anything.
        return;
    }

    return (
        <Popup
            trigger={
                <span className={clsx(styles.gradingHintTrigger)}>
                    <Icon path={mdiInformationOutline} size={0.7} />
                </span>
            }
            lockScroll
            closeOnEscape={true}
            closeOnDocumentClick={true}
            ref={ref}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <Card
                header={
                    <div className={clsx(styles.gradingHintPopupHeader)}>
                        <h3>Bewertung</h3>
                        <Button
                            icon={mdiCloseCircleOutline}
                            onClick={() => {
                                ref.current?.close();
                            }}
                        />
                    </div>
                }
            >
                <div>
                    {!grading?.points && <p>Für diese Frage besteht keine Bewertung.</p>}
                    {!!grading?.points?.gradingHint &&
                        (typeof grading.points?.gradingHint === 'function'
                            ? grading.points.gradingHint()
                            : grading.points?.gradingHint)}
                </div>
            </Card>
        </Popup>
    );
});
