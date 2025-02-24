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

---

## Testing

- **Rundown Test**: A rundown with 50 items in Hebrew, with original IDs ranging from `66792` to `66826`.

---

## Logs

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

### v1.8.5

Implemented bootstrap spinner with fixed show time (500). Timeout can be adjusted in renderTemplate function.
### v1.8.4

Renamed the new function to "Favorites"

Implemented keyboard key-trigger (skips all "input fields).

New config.json struct for favorites:   "favorites":[ {"name":"אצבע","id":10003, "key": "1"}, {"name":"סופר אישיות","id":10004, "key": "2"}, {"name":"2סופר אישיות","id":60032, "key": "3"} ]

Data is fetched from config.json: "templatesLinks":[ {"templateName":"אצבע","templateId":10003}, {"templateName":"סופר אישיות","templateId":10004}, {"templateName":"2סופר אישיות","templateId":60032} ]

### v1.8.3

Added link button with links to popular templates
Data is fetched from config.json: "templatesLinks":[ {"templateName":"אצבע","templateId":10003}, {"templateName":"סופר אישיות","templateId":10004}, {"templateName":"2סופר אישיות","templateId":60032} ]
### v1.8.2

Payload size limit increased to 50 MB.
Bootstrap removed from iframe (and also unused modal).
### v1.8.1

Limit for 40 chars at item name
### v1.8.0

Modal with predefined items links added.
### v1.7.9

Cleared from unused build tools installations
Implemented block mechanism to filter same 2 messages from inews (50 ms block)
Implemented UpdateNameEvent listener to trigger header name update from template updateName() event dispatch. Now, the problem with "what is the right input field for item name?" is solved - i just got trigger from template.
Focus on item load is partially solved.
### v1.7.8

Implemented page number column handling
### v1.7.5

Fixed item reorder (implemented counter in xmlToJson.js in inews library, and in my parser).
### v1.7.4

Added stor method in inews library (in both inewsClient.js and inewsConnectionClient.js).
### v1.7.3

Wrapping NA_setValue in try catch, to avoid crushing in some minor cases (my scripts conflicting with template embedded scripts)
Maybe the better way is to inject my script file before template embedded scripts..

### v1.7.2

Fix for single quote data input
### v1.7.1

Added input field that updates onKeyup, and when user hit "save" actually its value will be stored as name. When user open item, sql service will return this name, so we will see it. On any change, it will be automatically returned to static header+ first input field. So, the only thing that i have to add here, is some lock btn to disable name change, in case the name is custom and user still want to edit some gfx data on item
### v1.7.0

Added static header to item name (can be seated in addItemCategoryName config)
### v1.6.9

Ignore not enabled templates
onChange listener with debounce for preview server
Removed un-necessary "make-copy".
Added "reset prw" button.
### v1.6.6

Hide un-watched rundowns (enabled=0) on app load.
Implement new column "floating" in ngn_inews_stories.
"Make copy" button added on plugin-panel.
FTP client can set SITE FORMAT now, so its independent from inews site config. The optimal for us is "3nsml". The setting can be changed in config.json
In edit mode, "back" button is hidden.
When user try to open item that was deleted in db, he got error message (sql getItemData method returns "N/A" in this case).
Implemented new items hashmap to handle in use items globally in all watched rundowns. So, if user duplicate story, with the same items, and then delete one of those stories, inews-connect wont delete the item in the deleted stories, because in hash we count item use. It will delete the item only of its count will be 0. To handle it, hash class has add, remove, and isUsed methods.
We add to hash in items service => create item event, and in sql service => addDbStory.
We remove from cache in sql service => deleteItem.
We use isUsed method to check if item can be deleted in sql service => deleteItem.
Implemented handling for "unlinked items" - those who has been saved in db but not inews. Unlinked item-list backed up in json file. Scheduled task updates the json file every 10 mins. On load, inews-connect loads those items from cache file. In future, its possible to clear db based on unlinked list.
### v1.6.5

Plugin works.
hasAttachments() method added in inews-cache class.
We don't perform lineupExist() check anymore (increase performance).
Attachments parser can handle 2 types of MOS messages (edited item has different structure).
Iframe js file renamed to "iframe.js".
Handle "enabled" based on attachments. Still write all stories to db.
Added copy to clipboard option to copy items from stand-alone browser into inews.
Added float story handling
### v1.6.4

Storing parsed attachments as : attachments{ gfxItem {gfxTemplate, gfxProduction, itemSlug, ord} }.
Item service handles create andd reorder items. then, its call sql updateItem/updateItemOrd to update item in db. Then, cache the story.
Added getStoryAttachments in inews-service.
Sql-service func ordered by categories.
Added parseAttachments in xmlParser utility module.
Returned config.json and deleted yaml kombina.
### v1.6.3

Config.yaml instead json
### v1.6.2

Store item refactor
Item handling moved to sql-service and chained to story events
Added handling for attachment type .includes("").
Items processor. Handles item create, modify, reorder and delete actions.
### v1.6.1

The Inews-cache module has been implemented with support for all caching stores and methods.
Conducted horizontal development across the project, including module renaming and file deletions.
Cache data structures documented.
### v1.6.0

Implemented parallel ftp connections
Caching mechanism from scratch rebuild.
HTML injector for templates, merge plugin js with templates js automatically by link js files(utilities/file-processor.js).
REST routes for plugin.
Bootstrap grid implemented.
Many other structure and code changes, merges and improvements.
### v1.5.0

Inews-connect works with mssql.
I fetching the whole stories table once on each rundowns iteration, store it in storiesCache (overwrite), then compare stories from inews to the cache.
CheckStory is checking if its new story/reorder/modify.
Sql service have simplified methods to mssql (I avoided complicated merges and joins...).
config.json including now production value and uid placeholder for each rundown (Data structure change).
Added storiesCache module with single setter and getter.
Stories cache structure: [ { uid: '3124', name: '4', lastupdate: '1702161927',
rundown: '1091', production: '1', ord: 0, ordupdate: '1702161927',
enabled: true, tag: '', identifier: '046B337E',
locator: '0002B980:6574ECB8' }, . . . ]
Rundowns structure (from config.json): { 'SHOW.ALEX.RUNDOWN': { production: 1, uid: '1097' }, 'SHOW.ALEX.RUNDOWN2': { production: 1, uid: '1098' } }
### v1.2

Inews-connect now serving plugin webpage on http://server-ip-addr:3000/index.html
Data are stored in gfx server - inews storing only the ids. When open item from inews, the plugin receive element id => send this id to gfx server (now its emulator), and receives the element that user see on page.
Plugin interacts with with db-emulator (that emulate gfx elements play-out server) in those schemas:
Open gfx item from Inews:



Save gfx item to Inews (drag&drop/ apply/ ok):

 ### v### v1.1.1

Fixed lineup validation
Story changes now based on story locator (and not on modified date)
### v1.1

Layered architecture:
Dal layer - inews-ftp and local-store class with datastore methods (including activeLineup).
Separated App config that loads config.json
No globals anymore
Cleanups
### v1.0.2

Added utilities/lineup-validator.js script that fix the bug related to inews ftp plugin, that if user try to access path that does"t exists, its crush the process.
Separate inews service and rest service.
### v1.0.1

Fixed conversion of Hebrew string (added utilities/hebrew-decoder.js)
### v1.0.0
Init app with ftp client plugin, config file and basic REST API func.

REST API:

User can set active lineup (if lineup doesn't exists, app crushes, need bo be fixed), POST: localhost:3000/api/services/set-watcher/path-to-needed-lineup

Get current watched lineup in json format: GET: localhost:3000/api/watcher

Get folders list: GET: localhost:3000/api/services/get-dir/path-to-folder