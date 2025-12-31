#!/bin/bash
set -e

# XOOM Rides Database Backup Script
# This script creates automated backups of the PostgreSQL database

# Configuration
BACKUP_DIR="/var/backups/xoomrides"
DB_CONTAINER="xoomrides-db"
DB_USER="xoomrides_user"
DB_NAME="xoomrides"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="xoomrides_${DATE}.sql.gz"
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Start backup
echo "════════════════════════════════════════════════"
echo "  XOOM Rides Database Backup - $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    print_error "Database container '$DB_CONTAINER' is not running"
    exit 1
fi

print_info "Database container is running"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
print_info "Backup directory: $BACKUP_DIR"

# Perform backup
print_info "Creating backup: $BACKUP_FILE"

if docker-compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    print_success "Backup created successfully ($BACKUP_SIZE)"
else
    print_error "Backup failed"
    exit 1
fi

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    if [ -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
        print_success "Backup file verified (non-empty)"
    else
        print_error "Backup file is empty"
        exit 1
    fi
else
    print_error "Backup file not found"
    exit 1
fi

# Clean up old backups
print_info "Cleaning up backups older than $RETENTION_DAYS days..."

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "xoomrides_*.sql.gz" -mtime +$RETENTION_DAYS)
if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r old_backup; do
        rm -f "$old_backup"
        print_info "Removed: $(basename "$old_backup")"
    done
    print_success "Old backups cleaned up"
else
    print_info "No old backups to clean up"
fi

# Display backup statistics
echo ""
print_info "Backup Statistics:"
echo "   📁 Location: $BACKUP_DIR/$BACKUP_FILE"
echo "   📦 Size: $BACKUP_SIZE"
echo "   📅 Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# List recent backups
print_info "Recent backups:"
ls -lh "$BACKUP_DIR" | grep "xoomrides_" | tail -5 | awk '{print "   " $9 " (" $5 ")"}'

echo ""
print_success "Backup completed successfully!"
echo "════════════════════════════════════════════════"

# Exit with success
exit 0

