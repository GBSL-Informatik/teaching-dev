import { defineWorkerExtension } from '../../extensions';

export default defineWorkerExtension<number>(() => ({ example: { value: 42 } }));
