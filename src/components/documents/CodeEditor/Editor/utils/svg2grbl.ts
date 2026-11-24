import { parse, RootNode, Node, ElementNode } from 'svg-parser';

const objToAttr = (obj: Object) => {
    return Object.entries(obj || {})
        .map((v) => `${v[0]}="${v[1]}"`)
        .join(' ');
};

const mergeSvgProps = (parsedSvg: Node | RootNode, svgProps: Record<string, string | number> | undefined) => {
    if (parsedSvg.type === 'root') {
        parsedSvg.children.forEach((child) => {
            mergeSvgProps(child, svgProps);
        });
    } else if (parsedSvg.type === 'element' && parsedSvg.tagName === 'svg' && 'properties' in parsedSvg) {
        parsedSvg.properties = { ...(parsedSvg.properties || {}), ...svgProps };
    }
};

const GLOBAL_MODE = 'G90' as const;
const MM_UNIT = 'G21' as const;
const MM_WIDTH = 170 as const;
const MM_HEIGHT = 170 as const;
const rapid_move_to = (x: number, y: number) => `G91 X${x} Y${y} F4000`;

const SET_HOMEPOINT = 'G92 X0 Y0 Z0' as const;
const TURN_ON_SERVO = 'G1 F1000' as const;
const SAVE_SETTINGS = '$32=1' as const;
const PEN_DOWN = 'M3 S100' as const;
const PEN_UP = 'M3 S1000' as const;
const WAIT = 'G4 P0.1' as const;
const WAIT_ZERO = 'G4 P0' as const;
const CALIBRATE_HOME = '$H' as const;
const DRAW_SPEED = 3000 as const;
const PRECISION = 100000 as const;
let isPenDown = true;

const toPrecision = (value: number) => {
    return Math.round(value * PRECISION) / PRECISION;
};

const penUp = () => {
    if (!isPenDown) {
        return [];
    }
    isPenDown = false;
    return [PEN_UP, WAIT, GLOBAL_MODE];
};
const penDown = () => {
    if (isPenDown) {
        return [];
    }
    isPenDown = true;
    return [PEN_DOWN, WAIT, GLOBAL_MODE];
};
let x0 = 0;
let y0 = 0;
let scale = Math.min(MM_HEIGHT, MM_WIDTH) / 500;
let lastLineEnding: [number, number] = [0, 0];

const extractTransform = (element: ElementNode): [number, number] | [undefined, undefined] => {
    if (element.type === 'element' && element.tagName === 'g' && element.properties?.transform) {
        const transform = element.properties.transform as string;
        const translateMatch = transform.match(/translate\(([^)]+)\)/);
        if (translateMatch) {
            const [x, y] = translateMatch[1].split(/,|\s+/).map(Number);
            return [x, y];
        }
    }
    return [undefined, undefined];
};

const convert2Grbl = (element: Node | RootNode | string): string[] => {
    if (typeof element === 'string') {
        return [element];
    }
    const grbl: string[] = [];
    // const { properties, tagName, type, children } = element;
    if (element.type === 'root') {
        element.children.forEach((child) => {
            grbl.push(...convert2Grbl(child));
        });
    }
    if (element.type === 'element') {
        const { tagName, type, children } = element;
        const properties = element.properties || {};
        switch (element.tagName) {
            case 'svg':
                const firstChild = typeof children[0] === 'string' ? undefined : children[0];
                if (firstChild?.type === 'element' && firstChild?.tagName === 'g') {
                    const [x, y] = extractTransform(firstChild);
                    if (x !== undefined && y !== undefined) {
                        const size = Math.max(x, y) * 2;
                        scale = MM_WIDTH / size;
                    }
                }
                grbl.push(GLOBAL_MODE);
                grbl.push(MM_UNIT);
                grbl.push(TURN_ON_SERVO);
                grbl.push(...penUp());
                grbl.push(CALIBRATE_HOME);
                grbl.push(SET_HOMEPOINT);
                grbl.push(SAVE_SETTINGS);
                grbl.push(GLOBAL_MODE);
                grbl.push(rapid_move_to(MM_WIDTH / 2, MM_HEIGHT / 2));
                children.forEach((child) => {
                    grbl.push(...convert2Grbl(child));
                });
                grbl.push(...penUp());
                grbl.push(WAIT_ZERO);
                break;
            case 'rect':
                break;
            case 'g':
                if ((children || []).length === 0) {
                    return grbl;
                }
                if (properties.transform) {
                    const [x, y] = extractTransform(element);
                    if (x !== undefined && y !== undefined) {
                        x0 += x;
                        y0 += y;
                        children.forEach((child) => {
                            grbl.push(...convert2Grbl(child));
                        });
                        x0 -= x;
                        y0 -= y;
                    }
                }
                break;
            case 'line':
                if (properties.opacity === 0) {
                    return grbl;
                }
                const x1 = toPrecision(((properties.x1 as number) + x0) * scale);
                const y1 = toPrecision(((properties.y1 as number) + y0) * scale);
                const x2 = toPrecision(((properties.x2 as number) + x0) * scale);
                const y2 = toPrecision(((properties.y2 as number) + y0) * scale);
                if (x1 === x2 && y1 === y2) {
                    lastLineEnding = [x2, y2];
                    return grbl;
                }
                if (lastLineEnding[0] !== x1 || lastLineEnding[1] !== y1) {
                    grbl.push(...penUp());
                    grbl.push(`G0 X${x1} Y${y1}`);
                }
                grbl.push(...penDown());
                grbl.push(`G1 X${x2} Y${y2} F${DRAW_SPEED}`);
                lastLineEnding = [x2, y2];
                break;
            case 'circle':
                break;
            case 'text':
                break;
            case 'polygon':
                break;
        }
    }
    return grbl;
};

const svg2grbl = (svg: string, svgProps: Record<string, string | number>): string => {
    const parsed = parse(svg);
    console.log(JSON.stringify(parsed, null, 2));
    if (svgProps) {
        mergeSvgProps(parsed, svgProps);
    }
    const elements = convert2Grbl(parsed);
    return elements.join('\n');
};

export default svg2grbl;
