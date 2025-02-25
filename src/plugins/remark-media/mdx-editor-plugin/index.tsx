import { AudioDescriptor } from './AudioDescriptor';
import { CircuitDescriptor } from './CircuitverseDescriptor';
import { CodepenDescriptor } from './CodepenDescriptor';
import { LearningDescriptor } from './LearningDescriptor';
import { VideoDescriptor } from './VideoDescriptor';
import { YoutubeDescriptor } from './YoutubeDescriptor';

const MediaDescriptors = [
    VideoDescriptor,
    AudioDescriptor,
    YoutubeDescriptor,
    CircuitDescriptor,
    LearningDescriptor,
    CodepenDescriptor
];

export default MediaDescriptors;
