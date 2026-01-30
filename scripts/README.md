# Maintenance Scripts

## cleanup-old-rooms.js

Removes Firebase rooms older than 24 hours to prevent database bloat.

### Usage

```bash
pnpm cleanup:firebase
```

or

```bash
node scripts/cleanup-old-rooms.js
```

### What it does

- Scans all rooms in Firebase Realtime Database
- Deletes rooms where `createdAt` or `startTime` is older than 24 hours
- Keeps rooms with no timestamp (safety)
- Logs deletion count and age

### Scheduling (Optional)

To run automatically, you can:

**Option 1: Cron (Linux/Mac)**
```bash
# Add to crontab (runs daily at 3 AM)
0 3 * * * cd /path/to/obviously-static && node scripts/cleanup-old-rooms.js
```

**Option 2: Task Scheduler (Windows)**
- Create a scheduled task
- Action: `node.exe`
- Arguments: `scripts/cleanup-old-rooms.js`
- Start in: `C:\Users\gel\source\repos\obviously-static`

**Option 3: Firebase Rules (Better approach)**
Add TTL rules to your Firebase Realtime Database rules:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["createdAt", "startTime"]
      }
    }
  }
}
```

Then use Firebase Functions or this script on a schedule.
