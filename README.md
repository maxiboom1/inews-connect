# Inews-Connect

**Gateway to Third-Party Applications with HTML5 GFX Plugin**

---

## Main

Inews-Connect is a service that retrieves rundown data from **Avid Inews**, caches it, and updates an **MS-SQL database**. It is designed to serve Inews rundown data to **NA client - GFX applications** for CG operators in broadcast control rooms.

This design ensures isolated runtime for Inews-Connect and the NA client:
- **Inews-Connect** updates the database.
- **NA Client** monitors the changes.

It uses a **cache module** to store the current snapshot of Inews rundowns and updates the database only if there is a change between the cache and freshly fetched data.

---

## Logs

### 3.0.1
- Fixed a bug when - on user apply changes we didn't passed to createMosMsg() the gfxItem arg.

### 3.0.0
- Added ability to restore items from Inews and edit items in Inews while they are not monitored by Inews-Connect.
- Added items model and items-constructor (type setter).
- Added a new column to `ngn_inews_items`: `uuid` [nvarchar 36, allow nulls].
- Installed UUID library to generate unique identifiers for items, breaking the dependency on SQL primary key `uid`.
- Added an install SQL file to update `ngn_inews_items` (`Docs&&Database/db/add uuid command.txt`). **Note:** Before running it, delete the existing items table. This upgrade will reset the `uid` number and break all existing items.

### 2.1.3
- Added error handling for FTP connection errors/timeouts.

### 2.1.2
- Added storing of Inews `gfxData` and `GfxScripts`. To restore items from Inews, UUIDs are required to disconnect from SQL IDs.

### 2.1.1
- Removed parallel stories handling, even on app load.
- Added a new "time-measure" utility to measure load time.
- Added `this.loading` in Inews-service constructor to handle the loading loop.
- Added a "logger-messages" utility to centralize boot messages in the console.

### 2.1.0
- Switched from parallel stories handling to a one-by-one approach to avoid duplicates.
- Moved advanced config from user scope to internal app code (`pullInterval` and `ftpSiteFormat`).

### 2.0.9
- Refactored skipping login to private methods within Inews service.
- Improved color logger.

### 2.0.8
- Implemented skipping mechanisms for batch-added and batch-deleted stories.

### 2.0.7
- Implemented `syncStories` mechanism to handle story resynchronization.
- Added green logger for app greetings.

### 2.0.6 - Branch Update
- Renamed `deleteDebouncer` to `deleteService` and moved it to services.
- Added warning red logger and moved some loggers from SQL to high-level functions.
- Improved error scenario handling.

### 2.0.5
- Added a condition to clear `this.syncStories` array after 3 attempts.
- Added a placeholder to clear DB stories and rundown cache if more than 5 stories are added in a batch.
- Added version to `appConfig`.

### 2.0.4
- Single entry-point to `items-service`.
- Removed `sync-counter`.

### 2.0.3
- Optimized handling of cut stories with duplicates.

### 2.0.2
- Optimized rundown re-sync to only sync stories with duplicates related to moved master items.

### 2.0.1
- Implemented a mechanism to skip processing rundowns when new stories are detected.

### 2.0.0
- Added handling for copy/cut/paste item events.

### 1.9.9.2
- Fixed queries based on identifiers to include rundown UID checks.

### 1.9.9.1
- Added tooltips for duplicate status.
- Removed `lastRundownUpdate` debouncer.
- Added `delete-item-debouncer` to utilities.

### 1.9.9
- Added `lastUpdateRundown` call for original items when duplicates are edited.
- Added `last-update-service` to debounce `rundownLastUpdate` calls.

### 1.9.8
- Added duplicate status on the frontend.
- Added `showDuplicatesStatus` boolean in `appConfig`.

### 1.9.7
- Refactored `items-service` to a class.
- Added handling for items with duplicates on the frontend.

### 1.9.6
- Updated `lastRundownUpdate` for duplicates in other rundowns.

### 1.9.5.1
- Added "Ctrl+S" keystroke to save items.
- Added notifications for item saves.
- Fixed order bug in favorites render.

### 1.9.4
- Added copy-to-buffer function.
- Added duplicate checks on item updates.

### 1.9.3
- Implemented duplicates handling.
- Added `setNameOnLoad()` for static headers on load.

### 1.9.1
- Refactored `items-service`.
- Implemented duplicates cache and basic methods.

### 1.9.0
- Refactored `inews-service` to a class module.

### 1.8.8
- Implemented scenes and folder names normalizer.
- Added color codes for scenes.

### 1.8.7
- Implemented Bootstrap nested accordion for templates in scenes and folders.
- Added a logger with timestamps.

### 1.8.6
- Implemented favorites modifier key.
- Added a comment field in `config.json`.

### 1.8.5
- Implemented Bootstrap spinner with a fixed show time.

### 1.8.4
- Renamed the new function to "Favorites".
- Implemented keyboard key triggers.

### 1.8.3
- Added a link button for popular templates.

### 1.8.2
- Increased payload size limit to 50 MB.
- Removed Bootstrap from iframe.

### 1.8.1
- Added a 40-character limit for item names.

### 1.8.0
- Added a modal with predefined item links.

### 1.7.9
- Removed unused build tools.
- Implemented a block mechanism to filter duplicate messages from Inews.

### 1.7.8
- Implemented page number column handling.

### 1.7.5
- Fixed item reorder handling.

### 1.7.4
- Added `stor` method in Inews library.

### 1.7.3
- Wrapped `NA_setValue` in try-catch to avoid crashes.

### 1.7.2
- Fixed single quote data input.

### 1.7.1
- Added an input field for item names.

### 1.7.0
- Added a static header for item names.

### 1.6.9
- Ignored non-enabled templates.
- Added an "onChange" listener with debounce for preview server.

### 1.6.6
- Hid unwatched rundowns on app load.
- Added a "Make Copy" button on the plugin panel.

### 1.6.5
- Added `hasAttachments()` method in `inews-cache` class.
- Improved attachments parser.

### 1.6.4
- Stored parsed attachments in a structured format.

### 1.6.3
- Switched from `config.json` to `config.yaml`.

### 1.6.2
- Refactored item handling.
- Added handling for attachment types.

### 1.6.1
- Implemented the `Inews-cache` module with caching stores and methods.

### 1.6.0
- Implemented parallel FTP connections.
- Rebuilt the caching mechanism from scratch.

### 1.5.0
- Inews-Connect now works with MSSQL.
- Added `storiesCache` module.

### 1.2
- Inews-Connect now serves a plugin webpage.

### 1.1.1
- Fixed lineup validation.
- Story changes are now based on story locators.

### 1.1
- Implemented layered architecture.

### 1.0.2
- Added lineup validator script.

### 1.0.1
- Fixed Hebrew string conversion.

### 1.0
- Initial app release with FTP client plugin and basic REST API.

---

## Known Limitations & Bugs

- In Inews, deleting an item star `*` and jumping to another story before clearing the item preview box may not update the FTP API.
- Unlinked items in the database may need automatic cleanup.
- Item reorder events may have bugs.

---

## Possible Optimizations

- Cache template icons on HDD instead of memory.
- Avoid writing non-item stories to the database.