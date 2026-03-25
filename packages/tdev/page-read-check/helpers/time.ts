export const fSeconds = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const fSecondsLong = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    if (hours > 0) {
        return `${hours} Stunden ${minutes.toString().padStart(2, '0')} Minuten ${seconds.toString().padStart(2, '0')} Sekunden`;
    }
    return `${minutes} Minuten ${seconds.toString().padStart(2, '0')} Sekunden`;
};
