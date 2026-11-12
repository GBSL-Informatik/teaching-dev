import { describe, expect, it } from 'vitest';
import { typedDirectory, typedName } from '../assetPath';

describe('typedDirectory', () => {
    it.each([
        ['', './'],
        ['so', './'],
        ['./', './'],
        ['./assets/so', './assets/'],
        ['../assets/', '../assets/']
    ])('is the directory of %j', (typed, directory) => {
        expect(typedDirectory(typed)).toBe(directory);
    });

    it.each(['https://example.com/song.mp3', '/static/song.mp3', 'pathname:///song.mp3'])(
        'does not complete %j',
        (typed) => {
            expect(typedDirectory(typed)).toBeNull();
        }
    );
});

describe('typedName', () => {
    it.each([
        ['', ''],
        ['so', 'so'],
        ['./', ''],
        ['./assets/so', 'so']
    ])('is the name of %j', (typed, name) => {
        expect(typedName(typed)).toBe(name);
    });
});
