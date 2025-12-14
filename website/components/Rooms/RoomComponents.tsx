import TextMessages from '@tdev/text-message/TextMessages';
import type { RoomComponentsType } from '@tdev-original/components/Rooms/RoomComponents';

const RoomComponents: RoomComponentsType = {
    ['text_message']: {
        name: 'Textnachrichten',
        description: 'Textnachrichten können in einem Chat versandt- und empfangen werden.',
        component: TextMessages,
        default: true
    }
};

export default RoomComponents;
