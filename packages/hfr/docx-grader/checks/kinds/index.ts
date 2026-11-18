import { CheckKind, GradingContext } from '../Check';
import { documentSettings, DocumentSettingsCheck } from './documentSettings';
import { field, FieldCheck } from './field';
import { headerFooter, HeaderFooterCheck } from './headerFooter';
import { image, ImageCheck } from './image';
import { numbering, NumberingCheck } from './numbering';
import { paragraphFormat, ParagraphFormatCheck } from './paragraphFormat';
import { paragraphStyle, ParagraphStyleCheck } from './paragraphStyle';
import { runFormat, RunFormatCheck } from './runFormat';
import { section, SectionCheck } from './section';

export type Check =
    | ParagraphStyleCheck
    | ParagraphFormatCheck
    | RunFormatCheck
    | NumberingCheck
    | SectionCheck
    | HeaderFooterCheck
    | ImageCheck
    | FieldCheck
    | DocumentSettingsCheck;

export type CheckKindName = Check['kind'];

/** In the order the CLI and the results list them. */
export const CHECK_KINDS: { [K in CheckKindName]: CheckKind<Extract<Check, { kind: K }>> } = {
    paragraphStyle,
    paragraphFormat,
    runFormat,
    numbering,
    section,
    headerFooter,
    image,
    field,
    documentSettings
};

export const isCheckKind = (kind: unknown): kind is CheckKindName => {
    return typeof kind === 'string' && kind in CHECK_KINDS;
};

export const evaluateCheck = (check: Check, context: GradingContext): string[] => {
    switch (check.kind) {
        case 'paragraphStyle':
            return paragraphStyle.evaluate(check, context);
        case 'paragraphFormat':
            return paragraphFormat.evaluate(check, context);
        case 'runFormat':
            return runFormat.evaluate(check, context);
        case 'numbering':
            return numbering.evaluate(check, context);
        case 'section':
            return section.evaluate(check, context);
        case 'headerFooter':
            return headerFooter.evaluate(check, context);
        case 'image':
            return image.evaluate(check, context);
        case 'field':
            return field.evaluate(check, context);
        case 'documentSettings':
            return documentSettings.evaluate(check, context);
    }
};
