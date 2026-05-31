import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import Quiz from '@tdev-models/documents/Assessable/Quiz';
import Badge from '@tdev-components/shared/Badge';

interface QuizScoreProps {
    doc: Quiz;
}

export const QuizScore = observer(({ doc }: QuizScoreProps) => {
    const isMobileView = useIsMobileView();

    if (!doc || doc.maxHits === 0) {
        // No scoring, so we don't show anything.
        return null;
    }
    const maxPoints = doc.assessment?.scoring?.maxPoints ?? doc.maxHits;
    const maxPointsText = isMobileView ? `${maxPoints}p` : `${maxPoints} Punkt${maxPoints !== 1 ? 'e' : ''}`;

    if (!doc.isAssessed) {
        return (
            <Badge type="primary" className={styles.pointsBadge}>
                {isMobileView ? `Max.: ${maxPointsText}` : `Zu erreichen: ${maxPointsText}`}
            </Badge>
        );
    }
    const totalPointsAchieved = doc.assessment?.scoring?.pointsAchieved ?? 'N/A';
    return (
        <Badge type="primary" className={styles.pointsBadge}>
            {isMobileView
                ? `${totalPointsAchieved}/${maxPointsText}`
                : `Ergebnis: ${totalPointsAchieved}/${maxPointsText}`}
        </Badge>
    );
});
