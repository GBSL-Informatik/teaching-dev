import type { ExecutionEventSource } from '@tdev/pyodide-code/events';
import type { WorkerContext } from '@tdev/pyodide-code/extensions';
import {
    DEFAULT_SCENE_CONFIGURATION,
    type SceneConfiguration,
    type SceneSnapshot,
    type SnowflakeSnapshot
} from './protocol';

const SCENE_OPTIONS = ['width', 'height', 'background_color'];

export default class WorkerScene {
    readonly events: ExecutionEventSource;
    private readonly context: WorkerContext<SceneSnapshot>;
    private readonly id: string;
    private readonly flakes = new Set<SnowflakeSnapshot>();
    private configuration: SceneConfiguration = { ...DEFAULT_SCENE_CONFIGURATION };
    private nextSnowflakeId = 0;

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
    }

    add_snowflake(x: number, y: number, size: number, speed: number): SnowflakeSnapshot {
        const id = this.nextSnowflakeId;
        const snowflake: SnowflakeSnapshot = {
            get id() {
                return id;
            },
            x,
            y,
            size,
            speed
        };
        this.validateSnowflake(snowflake);
        this.nextSnowflakeId += 1;
        this.flakes.add(snowflake);
        return snowflake;
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
        this.context.send(this.id, { ...this.configuration, snowflakes });
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

    private validateSnowflake(snowflake: SnowflakeSnapshot) {
        if (!Number.isFinite(snowflake.x) || !Number.isFinite(snowflake.y)) {
            throw new Error('Snowflake coordinates must be finite numbers.');
        }
        if (!Number.isFinite(snowflake.size) || snowflake.size <= 0) {
            throw new Error('Snowflake size must be a positive finite number.');
        }
        if (!Number.isFinite(snowflake.speed)) {
            throw new Error('Snowflake speed must be a finite number.');
        }
    }
}
