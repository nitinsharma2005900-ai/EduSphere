#!/usr/bin/env bash
# EduSphere Automated Database & Media Backup Utility
set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="edusphere-postgres"
POSTGRES_DB="edusphere_db"
POSTGRES_USER="edusphere"

mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo "Starting EduSphere PostgreSQL Backup..."
echo "Timestamp: ${TIMESTAMP}"
echo "=========================================="

# 1. Dump database schema and data
docker exec -t "${DB_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_DIR}/edusphere_db_${TIMESTAMP}.sql.gz"

echo "✅ Database backup created: ${BACKUP_DIR}/edusphere_db_${TIMESTAMP}.sql.gz"

# 2. Archive uploaded media assets
if [ -d "./storage/uploads" ]; then
  tar -czf "${BACKUP_DIR}/edusphere_media_${TIMESTAMP}.tar.gz" -C ./storage uploads
  echo "✅ Media assets backup created: ${BACKUP_DIR}/edusphere_media_${TIMESTAMP}.tar.gz"
fi

echo "=========================================="
echo "Backup Completed Successfully!"
echo "=========================================="
