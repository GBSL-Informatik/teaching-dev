import React from 'react';
import Layout from '@theme/Layout';
import Radar from '../components';

const RadarPage = () => (
    <Layout
        title="K-LD7 Radar"
        description="Objektdistanzen und Positionen mit dem K-LD7 Radar über WebUSB messen."
    >
        <main className="container margin-vert--lg">
            <h1>K-LD7 Radar</h1>
            <p>Bewegte Objekte sichtbar machen: Distanz, Winkel und Geschwindigkeit direkt im Browser.</p>
            <Radar />
            <details className="margin-top--lg">
                <summary>Hardware verbinden</summary>
                <p>
                    K-LD7-EVAL mit FT232R-USB-UART-Kabel (VID 0403, PID 6001) anschliessen. UART: 115200 Baud,
                    8 Datenbits, gerade Parität, 1 Stopbit. WebUSB benötigt Chrome oder Edge auf HTTPS oder
                    localhost.
                </p>
                <p>
                    Andere Programme mit Zugriff auf den Adapter schliessen. Falls das Betriebssystem die
                    Schnittstelle belegt, ist ein passender USB-Treiber nötig (unter Windows beispielsweise
                    WinUSB für WebUSB). Unter Linux benötigt der Browser USB-Geräteberechtigungen und eine
                    freie Schnittstelle. Treiberänderungen können den Zugriff der RFbeam-PC-Software
                    beeinflussen.
                </p>
                <p>
                    Bei einem Timeout den Radar neu einschalten. Ein Doppler-Radar erkennt primär bewegte
                    Objekte; fehlende Ziele werden als leere Messung dargestellt.
                </p>
                <a href="https://rfbeam.ch/wp-content/uploads/dlm_uploads/2022/10/K-LD7_Datasheet.pdf">
                    RFbeam K-LD7 Datenblatt
                </a>
            </details>
        </main>
    </Layout>
);

export default RadarPage;
