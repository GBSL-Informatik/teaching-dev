# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

> [!NOTE]
> Compatible with @docusaurus/faster (rspack and swc).

## ENV

| Variable                   | For         | Default                 | Example             | Description                                                                                                                                                        |
|:---------------------------|:------------|:------------------------|:--------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `APP_URL`                  | Production  | `http://localhost:3000` |                     | Domain of the hosted app                                                                                                                                           |
| `BACKEND_URL`              | Production  | `http://localhost:3002` |                     | Url of the API Endpoint                                                                                                                                            |
| `CLIENT_ID`                | Production  |                         |                     | Azure ID: Client ID                                                                                                                                                |
| `TENANT_ID`                | Production  |                         |                     | Azure AD: Tenant Id                                                                                                                                                |
| `API_URI`                  | Production  |                         |                     | Azure AD: API Url                                                                                                                                                  |
| `STUDENT_USERNAME_PATTERN` | Production  |                         | `@edu`              | Users with usernames matching this RegExp pattern are displayed as students (regardless of admin status). If unset, all non-admin users are displayed as students. |
| `TEST_USERNAME`            | Development |                         | `admin.bar@bazz.ch` | To log in offline. Must correspond to a user email found in the API's database.\*                                                                                  |
| `SENTRY_DSN`               | Production  |                         |                     | Sentry DSN for error tracking                                                                                                                                      |
| `SENTRY_AUTH_TOKEN`        | Production  |                         |                     | Sentry Auth Token for error tracking                                                                                                                               |
| `SENTRY_ORG`               | Production  |                         |                     | Sentry Org for error tracking                                                                                                                                      |
| `SENTRY_PROJECT`           | Production  |                         |                     | Sentry Project for error tracking                                                                                                                                  |

\* To change users, clear LocalStorage to delete the API key created upon first authentication.<br />

## Upgrade Docusaurus

To upgrade docusaurus, run:

```bash
yarn upgrade @docusaurus/core@latest @docusaurus/faster@latest @docusaurus/preset-classic@latest @docusaurus/theme-classic@latest @docusaurus/theme-common@latest @docusaurus/module-type-aliases@latest @docusaurus/plugin-rsdoctor@latest @docusaurus/tsconfig@latest @docusaurus/types@latest
```