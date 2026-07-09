import { GenericJsxDescriptor } from '../CatchAllUnknown/GenericJsxDescriptor';
import AnswerDescriptor from './AnswerDescriptor';
import BrowserWindowDescriptor from './BrowserWindowDescriptor';
import { DdDescriptor, DeflistDescriptor, DtDescriptor } from './DeflistDescriptor';
import DocCardListDescriptor from './DocCardListDescriptor';
import QrCodeDescriptor from './QrCodeDescriptor';
import StepsDescriptor from './StepsDescriptor';

const JsxDescriptors = [
    BrowserWindowDescriptor,
    DocCardListDescriptor,
    DeflistDescriptor,
    DdDescriptor,
    DtDescriptor,
    AnswerDescriptor,
    QrCodeDescriptor,
    GenericJsxDescriptor,
    StepsDescriptor
];

export default JsxDescriptors;
