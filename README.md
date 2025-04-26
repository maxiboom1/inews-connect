# Inews-Connect Gateway to Third-Party Application with HTML5 GFX Plugin

**Main Description**:  
Inews-Connect is a service that retrieves rundown data from Avid iNews, caches it, and updates an MS-SQL database. It is designed to serve iNews rundown data to NA Client - GFX applications for CG operators in broadcast control rooms. This design isolates the runtime of Inews-Connect and NA Client: Inews-Connect updates the database, while NA Client monitors the changes. It uses a cache module to store the current snapshot of iNews rundowns and updates the database only when a change is detected between the cached and freshly fetched data.

---

## Known Limitations & Bugs

- **iNews Bug**: If you delete the item star `"*"` in iNews and jump to another story before iNews clears the item preview box, the FTP API won’t update. This is a pure iNews issue.
- **Unlinked Items**: If a user saves an item but doesn’t drag it to a story, it creates unlinked items in the database. These should be cleaned automatically via a timer mechanism.
- **Reorder Events Bug**: There’s an issue with item reorder events that needs research at the project’s end.

---

## Possible Optimizations

- Cache template icons (base64) on HDD instead of in memory. This increases HDD load when users open the plugin but reduces server memory usage.
- Avoid writing non-item stories to the database.
- Create a build - currently I running this as is - and I need to check the way to build it.

---

## Testing

- **Rundown Test**: A rundown with 50 items in Hebrew, with original IDs ranging from `66792` to `66826`.

---

## Logs

### Version 3.0.6
- Added handling for case that user opens existing item, click "save" (create empty item in DB), and then click "apply" in plugin UI.
 This causing logic error and data override. 
- Now, in this case once user sends "apply" request - the server checks if this item id is registered first.
If not - it returns "save error" - and in page we print error message using "show error" function.


### Version 3.0.5
- Added fallback for case that template don't provide any scripts.


### Version 3.0.4
- Added apostrophe decoder at data load from inews, and encode in createMosMessage().
- I use "__APOSTROPHE__" placeholder before saving it in inews. On app start, i use to replace those placeholders in xml-parser data and scripts.

### Version 3.0.3
- Clear template folder on load. 

### Version 3.0.2
- Fixed Favorites tab css direction property.

### Version 3.0.1
- Fixed a bug when - on user apply changes we didn't passed to createMosMsg() the gfxItem arg.
- Added ability of restoring items from inews, and edit items in inews while they not monitored by inews-connect.

### Version 3.0.0
- Added ability to restore items from Inews and edit items in Inews while they are not monitored by Inews-Connect.
- Added items model and items-constructor (type setter).
- Added new column to ngn_inews_items - uuid `nvarchar 36, allow nulls`
- Installed uuid library to generate uniq identifiers to items and break the foolish dependency of SQL primary key uid.
- Added install sql file to update `ngn_inews_items` (Docs&&Database/db/add uuid command.txt). Before running it, delete the existing items table. It will also reset the uid number, and break all existing items. This upgrade will make all existing items broken!

### Version 2.1.3
- Added error handling for FTP connection errors/timeouts.

### Version 2.1.2
- Added storage for `inews gfxData` and `GfxScripts`.  
- **Note**: To fully restore items from iNews, a UUID is needed to disconnect from SQL auto-incremented IDs. This requires careful planning.

### Version 2.1.1
- Removed parallel story handling, even on app load.
- Added `time-measure` utility to measure load time.
- Added `this.loading` in `inews-service` constructor to handle loading loops.
- Introduced `logger-messages` utility to consolidate boot messages in the console.

### Version 2.1.0
- Parallel story handling removed due to duplicates. On load, rundowns are fetched in parallel initially, then switched to a one-by-one approach for data consistency (slower but reliable).
- Moved advanced config (`pullInterval`, `ftpSiteFormat`) from user scope to internal app code.

### Version 2.0.9
- Refactored skipping login into private methods within `inews-service`.
- Improved color logger.

### Version 2.0.8
- Implemented skipping mechanisms for batch-added and batch-deleted stories.

### Version 2.0.7
- Implemented `syncStories` passing from `delete-service` as an object `{identifier: rundownStr}`. Converted to `this.syncStories` map with a counter: `{identifier: {rundownStr, counter}}`.
- On story check, if `identifier` and `rundownStr` match, resync the story and delete the map entry.
- Added `updateSyncStoriesMap` to decrease the counter and remove entries when it reaches 0.
- Added green logger for app greetings.

### Version 2.0.6 - Brunch Update
- Renamed `deleteDebouncer` to `delete-service` and moved it to `services`.
- Updated dependencies.
- Added red warning logger and shifted some loggers from SQL to high-level functions.
- Improved handling for multiple error scenarios.

### Version 2.0.5
- Clear `this.syncStories` array after 3 attempts; converted it to a map.
- Added a condition: if more than 5 stories are added in a batch, clear database stories and rundown cache, then fully resync.
- Added version to `appConfig`.

### Version 2.0.4
- Single entry point to `items-service`.
- Removed earlier `sync-counter`.
- **TO DO**: Clear `this.syncStories` array periodically.

### Version 2.0.3
- Optimization: Handle cases where a cut story with duplicates doesn’t exist, but its filename remains in `this.syncStories`. Clear `this.syncStories` using `syncCounter`, incremented on delete scheduling and decremented in `checkSyncStatus`.

### Version 2.0.2
- Optimization: Instead of triggering a full rundown resync when a master item moves, sync only stories with duplicates related to the moved master item. Store story filenames (unique) in duplicates cache and resync those if the master item moves.

### Version 2.0.1
- Implemented a mechanism to skip processing rundowns when new stories are detected.
- **Issue Resolved**: When a user cuts stories from one rundown and pastes them into another, updates could arrive out of order:
  1. New story updates arrive first, then delete events.
  2. Delete events arrive first, then new story updates.
- **Solution**: Added a flag-based mechanism (`skippedRundowns`) to detect new stories by comparing `"STORY"` item counts with the cache. Skips processing for that iteration to prioritize delete events, resetting the flag afterward.
- Removed `"uid"` prop from `"rundown"` in config file. Example: `"show.alex.rundown": {"production": 2}`.

### Version 2.0.0
- Added handling for copy/cut/paste item events.
- `DeleteItemDebouncer` manages item deletions with duplicate handling:
  - Immediate deletion for duplicates.
  - For items with duplicates: delete all duplicates, disable the item, and schedule deletion.
  - Revoked items cancel deletion and trigger rundown syncs for duplicates.
  - Uses timeouts to optimize and prevent conflicts.

### Version 1.9.9.2
- Fixed queries based on `identifier` only. Added `rundown` UID check to handle cases where stories in different rundowns share the same `identifier`. Modified query:  
  ```sql
  WHERE identifier = @identifier AND rundown = @rundown

### Version 1.9.9.1
- Added tooltip on duplicate status using new `getRundownStrAndStoryName` method in `inews-cache`.
- Moved `lastRundownUpdate` debouncer to utilities folder.
- Added `delete-item-debouncer` in utilities to handle cut/paste issues (in progress).

### Version 1.9.9
- Added `lastUpdateRundown` call for the original item if a duplicate in another rundown is edited.
- Introduced `last-update-service`, a debouncer for `rundownLastUpdate` calls with a 1-second timeout to reduce database calls. Planned to add `storyLastUpdate`.
- Prepared for cut/paste: Disable items instead of deleting them, revoke and update if the ID appears elsewhere.

### Version 1.9.8
- Added duplicate status on the frontend.
- Added `showDuplicatesStatus` boolean in `appConfig`. If true, duplicate status is included in `itemData`; otherwise, returns `hasDuplicate = false`.

### Version 1.9.7
- Refactored `items-service` to a class.
- Stored rundowns in `inews-service` constructor.
- Handled items with duplicates, passing `itemData.hasDuplicate` to the frontend and storing it in HTML as `data-hasDuplicate`.

### Version 1.9.6
- Updated `lastRundownUpdate` for duplicates across rundowns.

### Version 1.9.5.1
- Added `Ctrl+S` keystroke to save items.
- Added save notification.
- Minor style changes on plugin panel.
- Fixed order bug in favorites render.

### Version 1.9.4
- Added copy-to-buffer function; disabled drag.
- Added duplicate check on item updates from frontend to avoid errors.

### Version 1.9.3
- Implemented duplicates with functionality in `items-service` and `itemsHash` modules.
- Added `setNameOnLoad()` on frontend to set static headers on load.

### Version 1.9.1
- Refactored `items-service`.
- Implemented duplicates cache file and basic methods in `items-cache.js`.
- Added `erase` method to remove all duplicates from the database on load.
- **Stage 1**: On new story with a duplicate:
  1. Copy it in SQL with a new ID.
  2. Update duplicates cache: `{duplicateItemId: referenceItemId, ...}`.
  3. Update story cache with the new duplicate, removing the original.
- **Stage 2 (Pending)**: Handle story modifications with duplicates, syncing changes across all duplicates and cleaning on delete.

### Version 1.9.0
- Refactored `inews-service` to a class module, preparing for duplicate focus.

### Version 1.8.8
- Implemented scene and folder name normalizer.
- Added color coding on scenes based on `scene.color` from API.

### Version 1.8.7
- Implemented a Bootstrap nested accordion for sorting templates into scenes and folders:
  - Configs: `scenesAccordion` and `foldersAccordion` in `menu.css`.
  - **Logic**:
    - **Data Initialization**: `productionsData` array for fetched data.
    - **Fetching Productions**: `getProductions()` populates the production selector.
    - **Fetching Templates**: `getTemplates()` fetches templates on selection, creating scene and folder accordion items.
    - **Creating Items**: `createAccordionItem()` for scenes, `createFolderAccordionItem()` for folders with nested templates.
    - **Injecting Templates**: `createTemplateHtml()` injects template HTML.
- Added logger with timestamps.

### Version 1.8.6
- Added favorites modifier key (e.g., `alt`).
- Added `comment` field in `config.json`:
  ```json
  {
    "favorites": [
      {"name": "אצבע", "id": 10003, "key": "1"},
      {"name": "סופר אישיות", "id": 10004, "key": "2"},
      {"name": "2סופר אישיות", "id": 60032, "key": "x"}
    ],
    "favoritesModifier": "alt",
    "comment": [
      "possible modifiers: alt, ctrl, shift",
      "other comment for user use.."
    ]
  }

### Version 1.8.5
- Added Bootstrap spinner with a fixed 500ms timeout (adjustable in `renderTemplate`).

### Version 1.8.4
- Renamed function to `"Favorites"`.
- Implemented keyboard key-trigger (skips input fields).
- Updated `config.json` for favorites:
  ```json
  "favorites": [
    {"name": "אצבע", "id": 10003, "key": "1"},
    {"name": "סופר אישיות", "id": 10004, "key": "2"},
    {"name": "2סופר אישיות", "id": 60032, "key": "3"}
  ]
  ```

### Version 1.8.3
- Added link button with popular template links from `config.json`:
  ```json
  "templatesLinks": [
    {"templateName": "אצבע", "templateId": 10003},
    {"templateName": "סופר אישיות", "templateId": 10004},
    {"templateName": "2סופר אישיות", "templateId": 60032}
  ]
  ```

### Version 1.8.2
- Increased payload size limit to 50 MB.
- Removed Bootstrap from iframe and unused modal.

### Version 1.8.1
- Set 40-character limit for item names.

### Version 1.8.0
- Added modal with predefined item links.

### Version 1.7.9
- Cleared unused build tools.
- Added 50ms block mechanism to filter duplicate iNews messages.
- Implemented `UpdateNameEvent` listener for header updates from `template.updateName()`.

### Version 1.7.8
- Added page number column handling.

### Version 1.7.5
- Fixed item reorder with counter in `xmlToJson.js` and parser.

### Version 1.7.4
- Added `stor` method in iNews library (`inewsClient.js`, `inewsConnectionClient.js`).

### Version 1.7.3
- Wrapped `NA_setValue` in try-catch to avoid crashes from script conflicts.

### Version 1.7.2
- Fixed single-quote data input.

### Version 1.7.1
- Added input field updating on `keyup`, stored as name on save.

### Version 1.7.0
- Added static header to item name (configurable via `addItemCategoryName`).

### Version 1.6.9
- Ignored disabled templates.
- Added debounced `onChange` listener for preview server.
- Added "reset prw" button.

### Version 1.6.6
- Hid unwatched rundowns (`enabled=0`) on load.
- Added `floating` column in `ngn_inews_stories`.
- Added "Make copy" button on plugin panel.
- FTP client now sets `SITE FORMAT` (optimal: `"3nsml"`, configurable in `config.json`).
- Hid "back" button in edit mode.
- Added error message for deleted items (`sql getItemData` returns `"N/A"`).
- Implemented items hashmap for global item use tracking.

### Version 1.6.5
- Added `hasAttachments()` in `inews-cache`.
- Removed `lineupExist()` check for performance.
- Handled two MOS message types in attachments parser.
- Renamed iframe JS to `iframe.js`.
- Added copy-to-clipboard and float story handling.

### Version 1.6.4
- Stored parsed attachments as:  
  ```json
  attachments { gfxItem {gfxTemplate, gfxProduction, itemSlug, ord} }
  ```
- Added `getStoryAttachments` in `inews-service` and `parseAttachments` in `xmlParser`.

### Version 1.6.3
- Switched to `config.yaml` from JSON.

### Version 1.6.2
- Refactored item storage and handling to `sql-service`.

### Version 1.6.1
- Implemented `inews-cache` module with full caching support.

### Version 1.6.0
- Added parallel FTP connections and rebuilt caching mechanism.

### Version 1.5.0
- Integrated with MS-SQL, fetching and caching stories iteratively.

### Version 1.2
- Served plugin webpage at `http://server-ip-addr:3000/index.html`.

### Version 1.1.1
- Fixed lineup validation; story changes now use `story locator`.

### Version 1.1
- Introduced layered architecture with DAL layer.

### Version 1.0.2
- Added `lineup-validator.js` to fix FTP path access bug.

### Version 1.0.1
- Fixed Hebrew string conversion with `hebrew-decoder.js`.

### Version 1.0
- Initialized app with FTP client plugin, config file, and basic REST API.

---

## REST API

- **Set Active Lineup**:  
  `POST: localhost:3000/api/services/set-watcher/path-to-needed-lineup`  
  *(Note: Crashes if lineup doesn’t exist; needs fixing.)*

- **Get Current Watched Lineup**:  
  `GET: localhost:3000/api/watcher`

- **Get Folders List**:  
  `GET: localhost:3000/api/services/get-dir/path-to-folder`