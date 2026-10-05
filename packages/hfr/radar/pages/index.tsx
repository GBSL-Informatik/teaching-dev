import React from 'react';
import Layout from '@theme/Layout';
import Radar from '../components';

const RadarPage = () => (
    <Layout
        title="K-LD7 Radar"
        description="Objektdistanzen und Positionen mit dem K-LD7 Radar über die serielle Schnittstelle messen."
    >
        <main className="container margin-vert--lg">
            <h1>K-LD7 Radar</h1>
            <p>Bewegte Objekte sichtbar machen: Distanz, Winkel und Geschwindigkeit direkt im Browser.</p>
            <Radar />
            <details className="margin-top--lg">
                <summary>Hardware verbinden</summary>
                <p>
                    K-LD7-EVAL mit FT232R-USB-UART-Kabel (VID 0403, PID 6001) anschliessen. UART: 115200 Baud,
                    8 Datenbits, gerade Parität, 1 Stopbit. WebSerial benötigt Chrome oder Edge auf HTTPS oder
                    localhost.
                </p>
                <p>
                    «Seriell verbinden» wählen und den FTDI-COM-Port freigeben. Die Verbindung nutzt den
                    vorhandenen FTDI-Treiber. Andere Programme mit Zugriff auf den COM-Port vorher schliessen.
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
