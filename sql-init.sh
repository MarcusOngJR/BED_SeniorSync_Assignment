#!/usr/bin/env bash
set -euo pipefail

echo "Checking MSSQL_SA_PASSWORD..."
if [ -z "${MSSQL_SA_PASSWORD:-}" ]; then
  echo "ERROR: MSSQL_SA_PASSWORD is empty"
  exit 1
fi

# Find sqlcmd path
if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then
  SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
elif [ -x /opt/mssql-tools/bin/sqlcmd ]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
else
  echo "ERROR: sqlcmd not found"
  exit 1
fi

echo "Using sqlcmd at: $SQLCMD"
echo "Waiting for SQL Server..."
READY=0
for i in $(seq 1 60); do
  $SQLCMD -S "sql-server,1433" -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" && READY=1 && break
  sleep 2
done

if [ "$READY" -ne 1 ]; then
  echo "ERROR: SQL Server not reachable"
  exit 1
fi

echo "Running init script..."
$SQLCMD -b -S "sql-server,1433" -U sa -P "$MSSQL_SA_PASSWORD" -C -i /init.sql
echo "Done."
