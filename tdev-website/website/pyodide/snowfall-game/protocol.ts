export interface SceneConfiguration {
    width: number;
    height: number;
    background_color: string;
}

export interface SnowflakeSnapshot {
    readonly id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
}

export interface SceneSnapshot extends SceneConfiguration {
    snowflakes: readonly SnowflakeSnapshot[];
}

export const DEFAULT_SCENE_CONFIGURATION: Readonly<SceneConfiguration> = {
    width: 400,
    height: 800,
    background_color: 'black'
};
