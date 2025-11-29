# CaraML Playground Backend

## Local dev environment

In the bash terminal, run the following commands to set the environment variables for connecting to the local Postgres database:
```
export PGHOST=caraml-postgres.postgres.database.azure.com
export PGUSER=valerian.clerc_gmail.com#EXT#@valerianclercgmail.onmicrosoft.co
export PGPORT=5432
export PGDATABASE=postgres
export PGPASSWORD="$(az account get-access-token --resource https://ossrdbms-aad.database.windows.net --query accessToken --output tsv)"
```

And set up your env to have emsdk by running:

```
source /path/to/emsdk/emsdk_env.sh
```

Then, you can run the server with:
```
npm run dev
```