import { Primitive } from 'utility-types';

/**
 * MemoryStorage is a simple in-memory storage implementation that is used
 * when localStorage is not available.
 */
class MemoryStorage {
    private data: any = {};

    getItem(key: string) {
        return this.data[key] || null;
    }

    setItem(key: string, value: Primitive) {
        return (this.data[key] = String(value));
    }

    removeItem(key: string) {
        return delete this.data[key];
    }

    clear() {
        return (this.data = {});
    }
}

export default MemoryStorage;
