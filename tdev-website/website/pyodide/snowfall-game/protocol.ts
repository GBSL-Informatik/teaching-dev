export interface SceneConfiguration {
    width: number;
    height: number;
    background_color: string;
}

export interface DotSnapshot {
    readonly id: number;
    x: number;
    y: number;
    size: number;
    color: string;
}

export interface SnowflakeSnapshot extends DotSnapshot {
    speed: number;
}

export interface SceneSnapshot extends SceneConfiguration {
    snowflakes: readonly SnowflakeSnapshot[];
    dots: readonly DotSnapshot[];
}

export const DEFAULT_SCENE_CONFIGURATION: Readonly<SceneConfiguration> = {
    width: 400,
    height: 800,
    background_color: 'black'
};
