import User from '@tdev-models/User';

// Dummy tag function (can be empty)
function html(strings: TemplateStringsArray, ...values: unknown[]): string {
    return String.raw({ raw: strings }, ...values);
}

export const exportNameCards = (users: User[]) => {
    const nameCardCounts = users.reduce(
        (acc, student) => {
            acc[student.firstName] = (acc[student.firstName] || 0) + 1;
            return acc;
        },
        {} as { [key: string]: number }
    );
    const names = users.map((s) => {
        if (nameCardCounts[s.firstName] > 1) {
            return s.nameShort;
        }
        return s.firstName;
    });
    const template = html`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Namenskarten</title>
                <meta charset="UTF-8" />
                <style>
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                    }
                    h1 {
                        width: 100%;
                        line-height: 62mm;
                        padding: 0;
                        margin: 0;
                        font-size: 100pt;
                        page-break-inside: avoid;
                        transform: rotate(180deg);
                        &.small {
                            font-size: 80pt;
                        }
                    }
                    .page {
                        page-break-after: always;
                        border: 1px solid #000;
                        width: 190mm;
                        height: 277mm;
                        margin-bottom: 1em;
                        padding: 10mm;

                        overflow: hidden;
                    }
                    @media print {
                        .page {
                            border: none;
                            width: unset;
                            height: unset;
                            overflow: unset;
                            margin: 0;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${names
                    .map(
                        (name) =>
                            html`<div class="page">
                                <h1 class="${name.length > 10 ? 'small' : ''}">${name}</h1>
                            </div>`
                    )
                    .join('')}
            </body>
        </html>
    `;
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url);
    URL.revokeObjectURL(url);
};
