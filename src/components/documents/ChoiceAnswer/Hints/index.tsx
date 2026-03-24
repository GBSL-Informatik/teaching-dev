import { mdiClose, mdiCloseCircleOutline, mdiInformationOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import ChoiceAnswerDocument, { ChoiceAnswerScoring } from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import styles from './styles.module.scss';

interface QuestionScoringHintProps {
    doc?: ChoiceAnswerDocument;
    trigger?: React.ReactNode;
    questionIndex?: number;
}

export const QuestionScoringHint = observer(({ doc, trigger, questionIndex }: QuestionScoringHintProps) => {
    const ref = React.useRef<PopupActions>(null);

    if (!doc || questionIndex === undefined) {
        return;
    }

    const assessment = doc?.assessments.get(questionIndex);
    if (!!assessment?.scoring && !assessment.scoring.scoringHint) {
        // This question has a scoring but no scoring hint, so we don't show anything.
        return;
    }

    return (
        <Popup
            trigger={
                trigger || (
                    <span className={clsx(styles.gradingHintTrigger)}>
                        <Icon path={mdiInformationOutline} size={0.7} />
                    </span>
                )
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
                    {!assessment?.scoring && <p>Für diese Frage besteht keine Bewertung.</p>}
                    {!!assessment?.scoring?.scoringHint &&
                        (typeof assessment.scoring?.scoringHint === 'function'
                            ? assessment.scoring.scoringHint()
                            : assessment.scoring?.scoringHint)}
                </div>
            </Card>
        </Popup>
    );
});
