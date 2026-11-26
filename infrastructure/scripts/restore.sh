#!/usr/bin/env bash
# EduSphere Automated Database & Media Restore Utility
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <path_to_backup_sql_gz>"
  exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="edusphere-postgres"
POSTGRES_DB="edusphere_db"
POSTGRES_USER="edusphere"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "=========================================="
echo "Restoring EduSphere Database from: ${BACKUP_FILE}"
echo "=========================================="

gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "✅ Database restored successfully!"
