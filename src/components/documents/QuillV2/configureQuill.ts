import Quill from 'quill';
import ImageFormat from './ImageFormat';
import ImageResize from './quill-img-resize';

Quill.register(ImageFormat, true);
Quill.register('modules/imageResize', ImageResize, true);
