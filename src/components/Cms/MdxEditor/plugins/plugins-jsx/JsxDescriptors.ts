import AnswerDescriptor from './AnswerDescriptor';
import BrowserWindowDescriptor from './BrowserWindowDescriptor';
import { DdDescriptor, DeflistDescriptor, DtDescriptor } from './DeflistDescriptor';
import DocCardListDescriptor from './DocCardListDescriptor';
import GeneratorDescriptor from './QrDescriptors/GeneratorDescriptor';
import ScannerDescriptor from './QrDescriptors/ScannerDescriptor';

const JsxDescriptors = [
    BrowserWindowDescriptor,
    DocCardListDescriptor,
    DeflistDescriptor,
    DdDescriptor,
    DtDescriptor,
    AnswerDescriptor,
    ScannerDescriptor,
    GeneratorDescriptor
];

export default JsxDescriptors;
