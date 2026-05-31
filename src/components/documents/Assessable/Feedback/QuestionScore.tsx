import Icon from '@mdi/react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import { QuestionScoringHint } from '../Hints';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { IfmColors } from '@tdev-components/shared/Colors';
import { Correctness } from '@tdev-models/documents/Assessable/iAssessable';
import { mdiCheckCircleOutline, mdiCloseCircleOutline, mdiProgressCheck, mdiProgressQuestion } from '@mdi/js';
import type { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';
import Badge from '@tdev-components/shared/Badge';
import { useScrollTo } from '@tdev-hooks/useScrollTo';
import clsx from 'clsx';

interface FeedbackBadgeProps<T extends AssessableType> {
    doc: AssessableTypeModelMapping[T];
}

const ICONS_BY_CORRECTNESS: Record<Correctness, string> = {
    [Correctness.Correct]: mdiCheckCircleOutline,
    [Correctness.Incorrect]: mdiCloseCircleOutline,
    [Correctness.PartiallyCorrect]: mdiProgressCheck,
    [Correctness.NA]: mdiProgressQuestion
};

const COLORS_BY_CORRECTNESS: Record<Correctness, keyof typeof IfmColors> = {
    [Correctness.Correct]: 'green',
    [Correctness.Incorrect]: 'red',
    [Correctness.PartiallyCorrect]: 'orange',
    [Correctness.NA]: 'lightBlue'
};

export const QuestionScore = observer(<T extends AssessableType>(props: FeedbackBadgeProps<T>) => {
    const { doc } = props;
    const isMobileView = useIsMobileView();
    const [ref, animate] = useScrollTo(doc);

    if (!doc) {
        return null;
    }
    const maxPoints = doc.assessment?.scoring?.maxPoints ?? doc.maxHits;
    const maxPointsText = isMobileView ? `${maxPoints}p` : `${maxPoints} Punkt${maxPoints !== 1 ? 'e' : ''}`;

    return (
        <div className={clsx(styles.feedbackBadge, animate && styles.animate)} ref={ref}>
            {doc.assessment?.scoring && (
                <QuestionScoringHint
                    doc={doc}
                    trigger={
                        <span>
                            <Badge type="secondary" className={styles.pointsBadge}>
                                {doc.isAssessed && `${doc.assessment.scoring.pointsAchieved}/`}
                                {maxPointsText}
                            </Badge>
                        </span>
                    }
                />
            )}
            {!doc.assessment?.scoring && <QuestionScoringHint doc={doc} />}
            {doc.isAssessed && (
                <Icon
                    path={ICONS_BY_CORRECTNESS[doc.correctness]}
                    color={IfmColors[COLORS_BY_CORRECTNESS[doc.correctness]]}
                    size={1}
                />
            )}
        </div>
    );
});
