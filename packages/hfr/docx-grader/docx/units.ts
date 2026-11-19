const TWIPS_PER_CM = 1440 / 2.54;
const EMU_PER_CM = 360000;

const round = (value: number, decimals = 2) => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
};

/** Twentieths of a point, used for most lengths in WordprocessingML. */
export const twipsToCm = (twips: string | number) => round(Number(twips) / TWIPS_PER_CM);

export const twipsToPt = (twips: string | number) => round(Number(twips) / 20, 1);

export const halfPointsToPt = (halfPoints: string | number) => Number(halfPoints) / 2;

/** English Metric Units, used for drawing sizes. */
export const emuToCm = (emu: string | number) => round(Number(emu) / EMU_PER_CM);
