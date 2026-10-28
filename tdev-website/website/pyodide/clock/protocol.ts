export interface ClockTime {
    hours: number;
    minutes: number;
    seconds: number;
}

export type ClockUpdate = Partial<ClockTime>;
