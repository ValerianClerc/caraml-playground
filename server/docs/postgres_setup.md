# Postgres setup

Note: this assumes an Azure Flexible Postgres instance. Mostly following these docs: https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/security-entra-configure

## Connecting to postgres via Entra ID as admin

Set environment variables:
```
export PGHOST=caraml-postgres.postgres.database.azure.com
export PGUSER=valerian.clerc_gmail.com#EXT#@valerianclercgmail.onmicrosoft.co
export PGPORT=5432
export PGDATABASE=postgres
export PGPASSWORD="$(az account get-access-token --resource https://ossrdbms-aad.database.windows.net --query accessToken --output tsv)"
```

```
psql sslmode=require
```

Then you can run whatever admin commands you need to initialize managed identity connections:

```
select * from pgaadauth_create_principal('caraml-server', false, false);
```

## Connecting to postgres via Managed Identity

Client ID for caraml-server: 86ff641f-d974-4857-8d03-46ad7d74061d

Now, VMs can fetch tokens like this:
```
export PGPASSWORD=`curl -s 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fossrdbms-aad.database.windows.net&client_id=CLIENT_ID' -H Metadata:true | jq -r .access_token`
```

Now that we have the managed identity set up, we need to grant the permissions to the db user for the managed identity:

``sql
GRANT CONNECT ON DATABASE postgres TO "caraml-server";

GRANT USAGE, CREATE ON SCHEMA public TO "caraml-server";
, DELETE
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO "caraml-server";

-- for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES
```