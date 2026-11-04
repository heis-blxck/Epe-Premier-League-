# Scripts

Utilities used during development and maintenance. Run commands from the
repository root so relative paths resolve correctly.

## Folders

| Folder | Contents |
| --- | --- |
| `tools/` | Asset/logo generation helpers (`generate_logo.py`, etc.) |
| `maintenance/` | Data reset, wipe, recovery, and Firestore sync scripts |
| `legacy/patches/` | Archived one-off patch/fix/update scripts from earlier development |

## Important

- `maintenance/` scripts can modify or delete league data. Review the script
  before running it and back up `data/epe_league_db.json` first.
- `legacy/patches/` scripts were written to be run from the original repository
  root and to patch files in place. They are kept for reference only. Some
  relative paths will need adjusting if you ever reuse one.
- None of these scripts are part of the production build.
