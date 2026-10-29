import type { ExecutionEventSource } from '@tdev/pyodide-code/events';
import type { WorkerContext } from '@tdev/pyodide-code/extensions';
import {
    DEFAULT_SCENE_CONFIGURATION,
    type DotSnapshot,
    type SceneConfiguration,
    type SceneSnapshot,
    type SnowflakeSnapshot
} from './protocol';

interface ColorOptions {
    color?: string;
}

const SCENE_OPTIONS = ['width', 'height', 'background_color'];

export default class WorkerScene {
    readonly events: ExecutionEventSource;
    private readonly context: WorkerContext<SceneSnapshot>;
    private readonly id: string;
    private readonly flakes = new Set<SnowflakeSnapshot>();
    private readonly sceneDots = new Set<DotSnapshot>();
    private configuration: SceneConfiguration = { ...DEFAULT_SCENE_CONFIGURATION };
    private nextShapeId = 0;

    constructor(context: WorkerContext<SceneSnapshot>, id: string) {
        this.context = context;
        this.id = id;
        this.events = context.events.source(id);
    }

    get width(): number {
        return this.configuration.width;
    }

    get height(): number {
        return this.configuration.height;
    }

    get background_color(): string {
        return this.configuration.background_color;
    }

    get snowflakes(): SnowflakeSnapshot[] {
        // A snapshot keeps removal during Python iteration from skipping the next flake.
        return [...this.flakes];
    }

    get dots(): DotSnapshot[] {
        return [...this.sceneDots];
    }

    configure(options: Partial<SceneConfiguration> = {}) {
        if (!options || typeof options !== 'object') {
            throw new Error('Scene configuration must contain width, height, or background_color options.');
        }
        for (const option of Object.keys(options)) {
            if (!SCENE_OPTIONS.includes(option)) {
                throw new Error(`Unknown scene configuration option: ${option}`);
            }
        }
        const configuration = { ...this.configuration, ...options };
        this.validateConfiguration(configuration);
        this.configuration = configuration;
    }

    reset() {
        this.flakes.clear();
        this.sceneDots.clear();
    }

    add_snowflake(
        x: number,
        y: number,
        size: number,
        speed: number,
        options: ColorOptions = {}
    ): SnowflakeSnapshot {
        const snowflake = Object.assign(this.createDot(x, y, size, options), { speed });
        this.validateSnowflake(snowflake);
        this.flakes.add(snowflake);
        return snowflake;
    }

    add_dot(x: number, y: number, size: number, options: ColorOptions = {}): DotSnapshot {
        const dot = this.createDot(x, y, size, options);
        this.sceneDots.add(dot);
        return dot;
    }

    remove_dot(dot: DotSnapshot) {
        this.sceneDots.delete(dot);
    }

    remove_snowflake(snowflake: SnowflakeSnapshot) {
        this.flakes.delete(snowflake);
    }

    render() {
        this.validateConfiguration(this.configuration);
        const snowflakes = [...this.flakes].map((snowflake) => {
            this.validateSnowflake(snowflake);
            return { ...snowflake };
        });
        const dots = [...this.sceneDots].map((dot) => {
            this.validateDot(dot);
            return { ...dot };
        });
        this.context.send(this.id, { ...this.configuration, snowflakes, dots });
    }

    private validateConfiguration(configuration: SceneConfiguration) {
        if (!Number.isFinite(configuration.width) || configuration.width <= 0) {
            throw new Error('Scene width must be a positive finite number.');
        }
        if (!Number.isFinite(configuration.height) || configuration.height <= 0) {
            throw new Error('Scene height must be a positive finite number.');
        }
        if (typeof configuration.background_color !== 'string' || !configuration.background_color.trim()) {
            throw new Error('Scene background_color must be a non-empty CSS color string.');
        }
    }

    private createDot(x: number, y: number, size: number, options: ColorOptions): DotSnapshot {
        const id = this.nextShapeId;
        const dot: DotSnapshot = {
            get id() {
                return id;
            },
            x,
            y,
            size,
            color: options.color ?? 'white'
        };
        this.validateDot(dot);
        this.nextShapeId += 1;
        return dot;
    }

    private validateDot(dot: DotSnapshot) {
        if (!Number.isFinite(dot.x) || !Number.isFinite(dot.y)) {
            throw new Error('Shape coordinates must be finite numbers.');
        }
        if (!Number.isFinite(dot.size) || dot.size <= 0) {
            throw new Error('Shape size must be a positive finite number.');
        }
        if (typeof dot.color !== 'string' || !dot.color.trim()) {
            throw new Error('Shape color must be a non-empty CSS color string.');
        }
    }

    private validateSnowflake(snowflake: SnowflakeSnapshot) {
        this.validateDot(snowflake);
        if (!Number.isFinite(snowflake.speed)) {
            throw new Error('Snowflake speed must be a finite number.');
        }
    }
}
