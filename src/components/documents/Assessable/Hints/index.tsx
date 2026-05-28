import { mdiCloseCircleOutline, mdiInformationOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import ChoiceAnswerDocument from '@tdev-models/documents/Assessable/ChoiceAnswer';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import styles from './styles.module.scss';
import type { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';

interface QuestionScoringHintProps<T extends AssessableType> {
    doc?: AssessableTypeModelMapping[T];
    trigger?: React.ReactNode;
}

export const QuestionScoringHint = observer(
    <T extends AssessableType>(props: QuestionScoringHintProps<T>) => {
        const { doc, trigger } = props;
        const ref = React.useRef<PopupActions>(null);

        // TODO
        if (!doc) {
            return;
        }

        const assessment = doc.assessment;

        let scoringHint;
        if (!assessment?.scoring) {
            scoringHint = 'Für diese Aufgabe gibt es keine Punktebewertung.';
        } else if (!!assessment.scoring && !assessment?.scoring?.scoringHint) {
            scoringHint = 'Für diese Aufgabe ist kein Bewertungshinweis verfügbar.';
        } else {
            scoringHint =
                typeof assessment.scoring.scoringHint === 'function'
                    ? assessment.scoring.scoringHint()
                    : assessment.scoring.scoringHint;
        }

        return (
            <Popup
                trigger={
                    trigger || (
                        <span className={clsx(styles.scoringHintTrigger)}>
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
                        <div className={clsx(styles.scoringHintPopupHeader)}>
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
                    <div>{scoringHint}</div>
                </Card>
            </Popup>
        );
    }
);
