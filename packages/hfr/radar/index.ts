export { default as Radar } from './components';
export { default as RadarDevice } from './models/RadarDevice';
export type { RadarSettings, RadarTarget } from './models/protocol';
export const PluginName = 'radar';
export type { RadarMeasurement } from './models/RadarDevice';
export { default as useRadarDevice } from './hooks/useRadarDevice';
export type { DistanceRecord } from './models/DistanceFilters';
export { DISTANCE_FILTER_SETTINGS } from './models/DistanceFilters';
