import { mdiCheckCircleOutline, mdiCloseCircleOutline, mdiProgressCheck, mdiProgressQuestion } from '@mdi/js';
import Icon from '@mdi/react';
import type { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';
import Badge from '@tdev-components/shared/Badge';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { useScrollTo } from '@tdev-hooks/useScrollTo';
import { Correctness, CorrectnessColors } from '@tdev-models/documents/Assessable/iAssessable';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { QuestionScoringHint } from '../Hints';
import styles from './styles.module.scss';

interface FeedbackBadgeProps<T extends AssessableType> {
    doc: AssessableTypeModelMapping[T];
}

const ICONS_BY_CORRECTNESS: Record<Correctness, string> = {
    [Correctness.Correct]: mdiCheckCircleOutline,
    [Correctness.Incorrect]: mdiCloseCircleOutline,
    [Correctness.PartiallyCorrect]: mdiProgressCheck,
    [Correctness.NA]: mdiProgressQuestion
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
                    color={CorrectnessColors[doc.correctness]}
                    size={1}
                />
            )}
        </div>
    );
});
