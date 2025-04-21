---
page_id: c2469ac2-9cd2-45ac-9062-b2f0dcb912fc
---
# Chapter 7: API-Anwendung (Express App)

Willkommen zurück zu unserem Tutorial! In den vorherigen Kapiteln haben wir die einzelnen Bausteine unseres Backends kennengelernt: das **Datenbankschema** ([Kapitel 2: Datenbankschema (Prisma Schema)](02_datenbankschema__prisma_schema__.md)), die **Backend-Datenmodelle** ([Kapitel 1: Backend-Datenmodelle (Prisma Models)](01_backend_datenmodelle__prisma_models__.md)), die **Authentifizierung & Autorisierung** ([Kapitel 3: Authentifizierung & Autorisierung](03_authentifizierung___autorisierung_.md)), die **Dokumente** ([Kapitel 4: Dokumente (Content Units)](04_dokumente__content_units__.md)) und **Dokumentenbäume** ([Kapitel 5: Dokumentenbaum (Document Root)](05_dokumentenbaum__document_root_.md)), sowie die **Backend-Controller** ([Kapitel 6: Backend-Controller](06_backend_controller_.md)), die die Anfragen an die Modelle weiterleiten.

Stellen Sie sich vor, Sie haben all diese spezialisierten Abteilungen in Ihrem Backend-Bürogebäude (Datenmodelle, Authentifizierungsprüfer, Dokumentenverwalter). Aber wie kommen die Anfragen vom Frontend überhaupt rein? Wer sitzt an der Rezeption, koordiniert die Sicherheitskontrollen und den Papierkram, bevor die Anfrage beim richtigen Sachbearbeiter (dem Controller) landet?

Hier kommt die **API-Anwendung (Express App)** ins Spiel. In unserem Projekt ist dies die zentrale Instanz, die alle eingehenden HTTP-Anfragen empfängt, die notwendigen vorgelagerten Schritte (wie Authentifizierung und grobe Autorisierung) verwaltet und die Anfrage dann an den richtigen Controller weiterleitet. Man könnte sie als das "Betriebssystem" oder das "Hauptgebäude" bezeichnen, in dem all die anderen Komponenten leben und zusammenarbeiten.

## Was ist die API-Anwendung (Express App)?

In unserem `teaching-project` wird die API-Anwendung mit dem beliebten Node.js-Framework **Express.js** aufgebaut. Express.js bietet eine schlanke und flexible Grundlage für die Erstellung von Webservern und APIs.

Die API-Anwendung (repräsentiert durch das `app`-Objekt in `teaching-api/src/app.ts`) hat die Hauptverantwortung für:

1.  **Empfang von HTTP-Anfragen:** Sie lauscht auf einem bestimmten Port auf eingehende Anfragen vom Internet.
2.  **Verwaltung der Middleware-Pipeline:** Sie definiert eine Kette von Middleware-Funktionen, die *jede* eingehende Anfrage durchläuft, bevor sie zum eigentlichen Handler (Controller) gelangt. Diese Middleware übernehmen wichtige Querschnittsaufgaben.
3.  **Routing:** Sie nutzt den Express-Router, um eine Anfrage basierend auf ihrem Pfad und ihrer HTTP-Methode an den korrekten Controller-Handler ([Kapitel 6: Backend-Controller](06_backend_controller_.md)) zu leiten.
4.  **Zentrale Konfiguration:** Sie konfiguriert globale Einstellungen wie CORS (Cross-Origin Resource Sharing), Body Parsing (Lesen von JSON aus dem Request-Body) und Logging.
5.  **Zentrale Fehlerbehandlung:** Sie fängt Fehler ab, die von den Controllern oder Middleware geworfen werden, und formatiert eine standardisierte Fehlerantwort für den Client.
6.  **Integration von Echtzeit-Kommunikation:** Sie bindet die Socket.IO-Bibliothek für die Echtzeit-Kommunikation ([Kapitel 8: Echtzeit-Kommunikation (Socket.IO)](08_echtzeit_kommunikation__socket_io__.md)) ein und macht sie für andere Teile der Anwendung verfügbar.

Die API-Anwendung ist also nicht selbst für die Geschäftslogik zuständig (das sind die Modelle) und nicht für die spezifische Verarbeitung eines Endpunkts (das sind die Controller), sondern sie stellt die *Infrastruktur* bereit, die es ermöglicht, dass Anfragen korrekt empfangen, verarbeitet und an die richtigen Stellen weitergeleitet werden.

## Anwendungsfall: Eine Anfrage zur Benutzerprofil-Aktualisierung erreicht das Backend

Stellen Sie sich wieder vor, ein Benutzer klickt im Frontend auf "Speichern" nach der Bearbeitung seines Profils. Eine `PUT`-Anfrage wird an `/api/v1/users/:id` gesendet. Wie handhabt die API-Anwendung diese Anfrage, bevor sie überhaupt den User Controller erreicht?

Dieser Prozess wird durch die in `teaching-api/src/app.ts` definierte Middleware-Pipeline orchestriert.

Schauen wir uns einen vereinfachten Ausschnitt aus `teaching-api/src/app.ts` an, der zeigt, wie die Anwendung konfiguriert wird:

```typescript
// Aus teaching-api/src/app.ts (vereinfacht und Schlüsselstellen hervorgehoben)
import { strategyForEnvironment } from './auth/index';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import prisma from './prisma';
import path from 'path';
import cors from 'cors';
import morganMiddleware from './middleware/morgan.middleware';
import passport from 'passport';
import router from './routes/router';
import routeGuard, { createAccessRules } from './auth/guard'; // Importiert den RouteGuard
import authConfig from './routes/authConfig'; // Importiert die Autorisierungskonfiguration
import { type User } from '@prisma/client'; // Prisma User Typ
import { HttpStatusCode } from './utils/errors/BaseError';
import Logger from './utils/logger';
// ... weitere Importe für Socket.IO, Error Handling etc.

const AccessRules = createAccessRules(authConfig.accessMatrix); // Die Autorisierungsregeln vorbereiten

// Express Anwendung initialisieren
const app = express();
export const API_VERSION = 'v1';
export const API_URL = `/api/${API_VERSION}`;

// --- Konfiguration & Middleware ---

// CORS Middleware: Erlaubt Anfragen von verschiedenen Domains (wichtig für Frontend/Backend auf getrennten Servern)
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || true /* Konfiguriert erlaubte Ursprünge */
}));

// Body Parsing Middleware: Parsen eingehender JSON-Daten in req.body
app.use(express.json({ limit: '5mb' }));

// Logging Middleware: Loggt Details über jede eingehende Anfrage (z.B. mit Morgan, siehe teaching-api/src/middleware/morgan.middleware.ts)
app.use(morganMiddleware);

// Session Middleware: Verwaltet Benutzer-Sessions (speichert Session ID im Cookie, Session Daten in DB)
// (Details in Kapitel 3)
import connectPgSimple from 'connect-pg-simple';
const store = new (connectPgSimple(session))({ /* ... DB Config ... */ });
export const sessionMiddleware = session({
    name: process.env.APP_NAME || 'twa',
    store: store,
    secret: process.env.SESSION_SECRET || 'secret',
    /* ... weitere Session Optionen ... */
});
app.use(sessionMiddleware);

// Passport.js Middleware: Initialisiert und nutzt Passport für die Authentifizierung
// (Details in Kapitel 3)
app.use(passport.initialize());
app.use(passport.session()); // Nutzt die Session Middleware, um Benutzerstatus zu speichern/laden
passport.use(strategyForEnvironment()); // Verwendet die authentifizierung Strategie (Mock oder Azure AD)
// Konfiguriert, wie Benutzer in der Session gespeichert und geladen werden (serialize/deserialize)
passport.serializeUser((user, done) => { done(null, user.id); });
passport.deserializeUser(async (id: string, done) => {
    const user = await prisma.user.findUnique({ where: { id: id } });
    done(null, user as User); // Lädt User von ID und hängt ihn an req.user an
});

// Statisches Verzeichnis bedienen (z.B. für API-Dokumentation)
app.use(express.static(path.join(__dirname, '..', 'docs')));

// Öffentliche Endpunkte (z.B. Checklogin, Logout) - diese nutzen ggf. spezifische, einfachere Auth-Checks VOR dem Haupt-RouteGuard
// Sie können auch spezifische Middleware wie SessionOauthStrategy nutzen (siehe teaching-api/src/app.ts)
app.get(`${API_URL}/checklogin`, /* ... */);
app.post(`${API_URL}/logout`, /* ... */);

// --- Haupt-API-Routen mit RouteGuard und Router ---
export const configure = (_app: typeof app) => {
    // Notification Middleware: Bereitet Echtzeit-Notifications vor, die nach der Antwort gesendet werden
    _app.use((req: Request, res, next) => { /* ... Implementierung ... wird weiter unten gezeigt ... */ });

    // API Route Guard & Router:
    _app.use(
        `${API_URL}`, // Diese Middleware-Kette gilt für alle Pfade, die mit /api/v1/ beginnen
        // 1. Authentifizierungs-Middleware: Prüft req.isAuthenticated() ODER versucht Auth per OAuth Bearer Token
        (req, res, next) => {
            if (req.isAuthenticated()) { // req.user wurde von passport.session() gesetzt?
                return next(); // Benutzer ist authentifiziert, weiter zur nächsten Middleware
            }
            // Fallback: Wenn keine Session, versuche Authentifizierung per OAuth Bearer Token
            passport.authenticate('oauth-bearer', { session: true }, (err: Error, user: User, info: any) => {
                // Handhabt Ergebnis und leitet weiter oder sendet 401/403
                if (err) { return res.status(HttpStatusCode.UNAUTHORIZED).json({ error: err.message }); }
                 if (!user && /* ... ist kein öffentlicher Pfad ... */) { return res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'Unauthorized' }); }
                req.user = user; // Setze req.user für den Rest der Kette
                if (info) { req.authInfo = info; return next(); } // Token-Info auch anhängen
            })(req, res, next); // Rufe die durch passport generierte Middleware auf
        },
        // 2. Route Guard Middleware: Führt GROBE Autorisierung durch (prüft Pfad, Methode, isAdmin gegen accessMatrix)
        // (Details in Kapitel 3)
        routeGuard(AccessRules), // Wenn der RouteGuard den Zugriff erlaubt, ruft er next() auf

        // 3. Der Haupt-Router: Leitet die Anfrage an den spezifischen Controller-Handler weiter
        // (Details in Kapitel 6)
        router
    );

    // --- Zentrale Fehlerbehandlung ---
    // Diese Middleware wird aufgerufen, wenn eine vorherige Middleware oder ein Controller `next(error)` aufruft.
    // Wird hier nicht gezeigt, ist aber essentieller Bestandteil der Express App Konfiguration.
    // Beispiel: app.use((err, req, res, next) => { /* ... Fehler formatieren und senden ... */ });
     if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
         // In Produktion sendet Sentry Fehler an den Sentry-Server
         Sentry.setupExpressErrorHandler(_app);
     } else {
         // In anderen Umgebungen wird ein einfacher Error Handler verwendet
         _app.use((err: any, req: Request, res: Response, next: NextFunction) => {
             Logger.error('API Fehler:', err);
             const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
             res.status(statusCode).json({
                 error: err.message || 'Ein unbekannter Fehler ist aufgetreten.',
                 details: process.env.NODE_ENV !== 'production' && err.details ? err.details : undefined,
                 stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
             });
         });
     }
};

// Konfigurieren der App (wichtig für Tests, in server.ts für den eigentlichen Start)
if (process.env.NODE_ENV === 'test') {
    configure(app);
}

export default app;
```

Diese Datei (`app.ts`) ist das Herz der API-Anwendung. Sie importiert alle notwendigen Middleware und Router und konfiguriert Express, sie in der richtigen Reihenfolge zu verwenden.

### Die Middleware-Pipeline

Die Reihenfolge der `app.use()` Aufrufe ist entscheidend, da jede Middleware eine Anfrage verarbeiten kann, bevor sie sie mittels `next()` an die nächste Middleware in der Kette weitergibt. Wenn eine Middleware eine Antwort sendet (`res.send()`, `res.json()`, etc.), stoppt die Kette, und die Antwort wird an den Client gesendet. Wenn eine Middleware einen Fehler an `next()` übergibt (`next(error)`), wird der Rest der normalen Kette übersprungen, und Express springt zur ersten Fehlerbehandlungs-Middleware.

Für unsere `PUT /api/v1/users/:id` Anfrage durchläuft die Anfrage typischerweise diese Kette (nach `cors`, `express.json`, `morgan`):

1.  **`sessionMiddleware`**: Ladet die Benutzer-Session (falls vorhanden) aus der Datenbank basierend auf einem Cookie und hängt sie an `req.session` an.
2.  **`passport.initialize()`**: Initialisiert Passport.
3.  **`passport.session()`**: Nutzt die Session, um `passport.deserializeUser` aufzurufen. Dieser lädt den authentifizierten Benutzer (`req.user`) basierend auf der User-ID in der Session ([Kapitel 3: Authentifizierung & Autorisierung](03_authentifizierung___autorisierung_.md)).
4.  **Selbstdefinierte Authentifizierungs-Middleware**: Diese Middleware (innerhalb des `app.use(API_URL, ...)` Blocks) prüft zunächst, ob `req.user` bereits gesetzt ist (erfolgreiche Session-basierte Auth). Wenn nicht, versucht sie eine Token-basierte Authentifizierung (`passport.authenticate('oauth-bearer', ...)`). Nur authentifizierte Anfragen oder Anfragen an speziell erlaubte öffentliche Pfade dürfen diese Middleware passieren.
5.  **`routeGuard(AccessRules)` Middleware**: Führt die grobe Autorisierungsprüfung durch ([Kapitel 3]). Sie prüft, ob die Kombination aus angefragtem Pfad (`/users/:id`), HTTP-Methode (`PUT`) und dem `isAdmin`-Status von `req.user` in der `accessMatrix` ([Kapitel 3]) erlaubt ist. In unserem Fall erlaubt die Matrix `PUT /users/:id` für Nicht-Admins, also lässt der RouteGuard die Anfrage passieren.
6.  **`router`**: Da alle vorherigen Middleware die Anfrage durchgelassen haben, erreicht sie nun den zentralen Express-Router. Der Router sucht nach einer Route, die zu `PUT /users/:id` passt ([teaching-api\src\routes\router.ts]) und leitet die Anfrage an den registrierten Controller-Handler ([Kapitel 6]) weiter (in diesem Fall die exportierte `update`-Funktion in `teaching-api\src\controllers\users.ts`).

### Notifications Middleware

Der `configure` Block in `app.ts` enthält auch eine spezielle Middleware für **Notifications**:

```typescript
// Aus teaching-api/src/app.ts (Ausschnitt aus configure)
_app.use((req: Request, res, next) => {
    res.on('finish', async () => { // Wird ausgeführt, NACHDEM die Antwort an den Client gesendet wurde
        if (res.statusCode >= 400) { // Nur bei erfolgreichen Antworten
            return;
        }
        const io = req.io as Server<ClientToServerEvents, ServerToClientEvents>; // Der Socket.IO Server (siehe Kapitel 8)

        if (res.notifications && io) { // Wenn der Controller Notifications an res.notifications angehängt hat
            res.notifications.forEach((notification) => {
                // Sendet die Notification via Socket.IO an die spezifizierten Clients
                io.except(/* ... */).to(notification.to).emit(notification.event, notification.message as any);
            });
        }
    });
    next(); // Wichtig: Diese Middleware beeinflusst die Antwort nicht direkt, nur nachdem sie gesendet wurde.
});
```

Diese Middleware wird *nach* dem Router (und dem Controller, der vom Router aufgerufen wurde) ausgeführt, aber noch *innerhalb* des Express-Request-Zyklus. Sie benutzt das `res.on('finish', ...)` Event, das erst ausgelöst wird, nachdem die HTTP-Antwort vollständig an den Client gesendet wurde. Dies stellt sicher, dass Notifications über Socket.IO verschickt werden, aber die HTTP-Antwort nicht durch mögliche Verzögerungen beim Senden der Socket-Nachricht blockiert wird. Wenn ein Controller eine `res.notifications`-Liste füllt, sorgt diese Middleware automatisch für deren Versand. (Mehr zu Socket.IO in [Kapitel 8: Echtzeit-Kommunikation (Socket.IO)](08_echtzeit_kommunikation__socket_io__.md)).

### Zentrale Fehlerbehandlung

Obwohl nicht vollständig im Ausschnitt gezeigt, ist die zentrale Fehlerbehandlungs-Middleware ein wichtiger Teil der Express App. Sie wird am Ende der Middleware-Kette registriert (`app.use((err, req, res, next) => { ... })`). Wenn *irgendeine* Middleware oder *irgendein* Controller in der Kette einen Fehler über `next(error)` weiterleitet, wird diese spezielle Middleware aufgerufen. Sie ist dafür zuständig, den Fehler abzufangen, eine standardisierte HTTP-Fehlerantwort (z.B. 403 Forbidden, 404 Not Found, 500 Internal Server Error) zu formatieren und an den Client zu senden. Dies verhindert, dass die Anwendung bei einem Fehler abstürzt und sorgt für konsistente Fehlerantworten.

## Unter der Haube: Der Fluss durch die Express App

Nehmen wir den Fluss einer Anfrage und zoomen in die Rolle der Express App hine.

```mermaid
sequenceDiagram
    participant Frontend
    participant ExpressApp as Express App
    participant MiddlewareChain as Middleware
    participant Router
    participant Controller
    participant Model
    participant Datenbank

    Frontend->>ExpressApp: HTTP-Anfrage (z.B. PUT /api/v1/users/...)
    ExpressApp->>MiddlewareChain: Starte Pipeline (z.B. CORS, JSON Body Parse)
    loop Jede Middleware in Reihenfolge
        MiddlewareChain->>MiddlewareChain: Verarbeite Anfrage / Response
        opt Middleware erlaubt Weitergabe
            MiddlewareChain->>MiddlewareChain: ruf next() auf
        else Middleware sendet Antwort
            MiddlewareChain-->>Frontend: Sende HTTP-Antwort (verhindert next())
            break
        else Middleware wirft Fehler
            MiddlewareChain--xExpressApp: Übergibt Fehler (next(error))
            break
        end
    end
    opt Middleware-Kette durchlaufen
        ExpressApp->>Router: Anfrage wird an Router übergeben
        Router->>Controller: Router matcht & ruft Handler auf
        Controller->>Model: Delegiert Logik
        Model->>Datenbank: Datenzugriff etc.
        Datenbank-->>Model: Ergebnis
        Model-->>Controller: Ergebnis/Fehler
        Controller-->>ExpressApp: Formatiert Antwort oder wirft Fehler
        opt Controller wirft Fehler
            ExpressApp->>ExpressApp: Gehe zu Fehlerbehandlungs-Middleware
        end
        ExpressApp-->>Frontend: Sende endgültige HTTP-Antwort
    else Fehler in Middleware
        ExpressApp->>ExpressApp: Gehe zu Fehlerbehandlungs-Middleware
        ExpressApp-->>Frontend: Sende Fehlerantwort
    end

```

Dieses Diagramm veranschaulicht, wie die Express App (dargestellt durch die *Reihenfolge* der Middleware und schliesslich des Routers) die zentrale Steuerungseinheit ist. Jede Anfrage kommt *durch* die App und wird nacheinander von den registrierten Middleware verarbeitet. Erst wenn alle Middleware, die vor dem Router stehen, `next()` aufrufen, erreicht die Anfrage den Router und damit den spezifischen Controller. Fehler oder das Senden einer Antwort unterbrechen diesen Fluss. Die zentrale Fehlerbehandlung fängt alle unverarbeiteten Fehler am Ende der Kette ab.

## Fazit

Die **API-Anwendung**, aufgebaut mit Express.js in `teaching-api/src/app.ts`, ist das Herzstück unseres Backends. Sie ist der erste Kontaktpunkt für alle eingehenden HTTP-Anfragen vom Frontend. Ihre Hauptaufgaben sind die Einrichtung der Server-Infrastruktur, die Verwaltung des Middleware-Stacks (für Aufgaben wie CORS, Body Parsing, Logging, Session-Management, Authentifizierung und grobe Autorisierung) und das Weiterleiten der Anfragen an den korrekten Router, der schliesslich den zuständigen Controller findet. Sie bietet auch Mechanismen für die zentrale Fehlerbehandlung und die Integration von Echtzeit-Notifications.

Durch die orchestratorische Rolle der API-Anwendung wird sichergestellt, dass jede Anfrage die notwendigen vorgelagerten Schritte durchläuft, bevor sie zur eigentlichen Geschäftslogik in den Controllern und Models vordringt. Dies schafft eine robuste und erweiterbare Struktur für das gesamte Backend.

Wir haben nun den vollständigen Weg einer HTTP-Anfrage vom Frontend über die API-Anwendung, Middleware, Router und Controller bis hin zu den Models und der Datenbank verstanden. Aber was ist mit der Kommunikation, die *nicht* über traditionelle HTTP-Anfragen läuft, sondern in Echtzeit stattfinden muss? Im nächsten Kapitel widmen wir uns der **Echtzeit-Kommunikation (Socket.IO)**.

Weiter geht es mit [Kapitel 8: Echtzeit-Kommunikation (Socket.IO)](08_echtzeit_kommunikation__socket_io__.md).

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)
