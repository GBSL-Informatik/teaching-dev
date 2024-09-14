# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## ENV

| Variable      | For         | Default                 | Example             | Description                                                                       |
|:--------------|:------------|:------------------------|:--------------------|:----------------------------------------------------------------------------------|
| APP_URL       | Production  | `http://localhost:3000` |                     | Domain of the hosted app                                                          |
| BACKEND_URL   | Production  | `http://localhost:3002` |                     | Url of the API Endpoint                                                           |
| CLIENT_ID     | Production  |                         |                     | Azure ID: Client ID                                                               |
| TENANT_ID     | Production  |                         |                     | Azure AD: Tenant Id                                                               |
| API_URI       | Production  |                         |                     | Azure AD: API Url                                                                 |
| TEST_USERNAME | Development |                         | `admin.bar@bazz.ch` | To log in offline. Must correspond to a user email found in the API's database.\* |

\* To change users, clear LocalStorage to delete the API key created upon first authentication.<br/>