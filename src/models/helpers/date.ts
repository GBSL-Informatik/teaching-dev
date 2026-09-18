export const formatDate = (date: Date, useLocalTime?: boolean) => {
    if (useLocalTime) {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return date.toISOString().slice(0, 10).split('-').reverse().join('.');
};

export const formatTime = (date: Date, useLocalTime?: boolean) => {
    if (useLocalTime) {
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toISOString().slice(11, 16);
};

export const formatDateTime = (date: Date | string, useLocalTime?: boolean) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${formatDate(d, useLocalTime)} ${formatTime(d, useLocalTime)}`;
};
