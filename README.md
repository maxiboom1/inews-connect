Inews-connect gateway to third party application, with HTML5 GFX plugin.

**Main**
Inews-connect is an service that gets rundowns data from Avid Inews, caches them, and updates MS-SQL database. 
Inews-connect designed to serve the Inews rundowns data to NA client - GFX applications for CG operators at broadcast control rooms.
This design provides isolated runtime of inews-connect and NA client - Inews-connect updates DB, NA client monitors the changes. 

It uses cache module to store the current snapshot of inews rundowns, and updates DB only if there was change between cache and fetched fresh data.

**Startup Diagram**

[View Startup Image PDF](./Docs&&Database/workflows/App-start.pdf)

**Known-limitations && bugs:**

- In Inews, if you delete the item star "*", and jumps to other story before inews clears the item preview box, the ftp api wont be updated. 
This is pure Inews bug..
- If user saves item, but not drag it to story - it will create unlinked items in db - those should be cleaned automatically by some timer mechanism..
- We have bug in items - reorder events. It should be researched at project end.

Possible optimizations:
- Cache template icons (base64) on hdd, and not in cache memory. 
It will increase hdd load when users opens plugin, but reduce memory usage of server.
- Avoid to write non-item stories to db 

Testing:

Rundown with 50 items in hebrew. it original id is  66792 - 66826

**LOGS:**

2.1.3

- Error handling on FTP connection err/timeout.

2.1.2

- Added storing to inews gfxData and GfxScripts. If I really want to be able restore items from inews - i need to add also uuid and disconnect from sql id. Otherwise, its not allowed to restore auto-incremented sql id's. Need to plan it carefully.

2.1.1

- No-parallel stories handling anymore, even on app load.
- New "time-measure" utility - to measure load time.
- this.loading in inews-service constructor to handle loading loop.
- New "logger-messages" utility, that concentrate the boot message in console.

2.1.0

- Parallel stories handling is wonderful, but I have to avoid it because of duplicates. So on load i fetch the first time the rundowns parallely, and then i switch to one-by-one approach. This is slowest, but keep data constancy.
- Some advanced config was moved from user scope to internal app code (pullInterval and ftpSiteFormat).

2.0.9

- Refactored skipping login to private methods within inews service.
- Improved color logger.

2.0.8

- Implemented skipping mechanisms for batch added and batch deleted stories.


2.0.7

- Implemented syncStories that passes from delete-service as obj {identifier:rundownStr}. We convert it to this.syncStories map and add counter prop: {identifier: {rundownStr, counter}}. On story check - we check if identifier and rundowns Str have match - if so, resync story and delete entry from map. Every process iteration run updateSyncStoriesMap that decrease counter and deletes entry if it 0.
- Added green logger for app greetings.


2.0.6 - Brunch update

- Rename deleteDebouncer to delete service and move it to services + dependencies update.
- Added wanr red logger, move some loggers from SQL to high level functions
- Many error scenario handling.

2.0.5

- Clear this.syncStories array after 3 attempts. Convert it to map.
- Added condition that checks if more than 5 stories was added in batch - this is the placeholder to clear db stories and rundown cache, and completly resync in this case
- Added version to appConfig.

2.0.4

- Single entry-point to items-service.
- Removed sync-counter that was implementer earlier
- TO DO: Must clear this.syncStories array from time to time !


2.0.3

- Optimization update: handle case that cutted story with duplicate doesn't exists, but its filename still in this.syncStories arr. 
So, in this case we clear this.syncStories using this.syncCounter, which incremented each time we schedule delete. And decrements in checkSyncStatus func.

2.0.2

- Optimization update: Instead trigger complete rundown re-sync when master item moved, we sync only stories that have duplicates related to moved master item. We store in duplicates cache story filename (uniq value), and if their master item moved, we pass those filenames to re-sync.

2.0.1

- Implemented a mechanism to skip processing rundowns when new stories are detected.

This resolves an issue that occurs when a user cuts stories from one rundown and pastes them into another. Updates from the original rundown (deletes) and the target rundown (new story creation) can arrive in random sequences:
1. New story updates arrive first, followed by delete events.
2. Delete events arrive first, followed by new story updates.

In the first case, duplicates are created for items whose originals were deleted before the system received the delete update, leading to item loss.

To address this, a flag-based mechanism (`skippedRundowns`) was added. It detects when new stories are added by comparing the number of "STORY" items with the cached count. When detected, the system skips processing the rundown for that iteration, ensuring delete events are handled before processing new stories. The flag resets after processing to maintain normal operation.

- In config file, removed "uid" prop from "rundown", so now we can register rundown as: "show.alex.rundown": {"production": 2}.

2.0.0

- Handling copy/cut/paste item events.

DeleteItemDebouncer handles item deletions with duplicate management. 
If an item is a duplicate, it's deleted immediately. 
For items with duplicates, all duplicates are deleted, the item is disabled, and its deletion is scheduled. 
Revoked items cancel deletion and trigger rundown syncs for duplicates. 
The module uses timeouts to optimize operations and prevent conflicts.

1.9.9.2

- Fix for queries based on identifier only - I found that in some cases stories in different rundowns may have the same identifier - so in those cases i added check also for rundown uid - so the modified query condition looks like this: 
```WHERE identifier = @identifier AND rundown = @rundown;```

1.9.9.1

- Added tooltip on duplicate status - to fetch this data on server we use new getRundownStrAndStoryName method in inews-cache. 
- Removed lastRundownUpdate debouncer to utilities folder
- Added new delete-item-debouncer to utilities. It can receive item to delete, wait and then, on condition delete it. This should solve the cut/paste item issue. It still in work.

1.9.9

- Added lastUpdateRundown call to original item in case user edited duplicate of this item,that placed in other rundown.
- Added last-update-service - basically its simple debouncer that handle rundownLastUpdate calls, and if there are to many, and sets 1 sec timeout debounce. This reduce database calls. I need to add to it also storyLastUpdate.
- Some updates in cleanups in code structure.
- Now it seems I ready for cut/paste items - the case that user cut the item, normally will delete it. The idea is to disable it instead of delete, and if we notice this id in other story - revoke the item and update its data according new position.

1.9.8

- Added duplicate status on front. 
- Added showDuplicatesStatus boolean in appConfig. In routes, if it true, we add the duplicate status to itemData, otherwise, we always return to front hasDuplicate = false, so no duplicates status will be rendered.

1.9.7

- Refactored items-service to class.
- Store rundowns in inews-service constructor
- Handle items that have duplicates and pass it to front page (Adding itemData.hasDuplicate value in route).
- Handle hasDuplicate on front and store in html body atr as "data-hasDuplicate".

1.9.6

- Update "lastRundownUpdate" on duplicates related to other rundowns.

1.9.5.1

- Added "ctrl+s" keystroke to save items.
- Added notification once item saved.
- Some minor style changes on plugin panel.
- Fixed order bug in favorites render.

1.9.4

- Added copy to buffer function. Drag function disabled.
- Added duplicate check on update item from front - to avoid error

1.9.3

- Implemented duplicates.
- Lot of functionality in items-service and itemsHash modules.
- Implemented setNameOnLoad() on front pages - to set static headers on load



1.9.1

- Refactor for items service
- Implemented duplicates cache file and basic methods in items-cache.js
- Implemented erase method to erase all duplicates from DB on load.
- Handling duplicates - stage1: On new story - if we catch duplicate item then we:
1. Make copy of it in SQL - with new id
2. Update duplicates cache ({dulicateItemId:referenceItemId, ...});
3. Update story cache with new duplicate item, and remove the original.

- Now, on stage 2 we need to handle modify story with duplicates. What should happens when user reorder duplicated item? 
Keep in mind, any modify of duplicate is an modify of reference item (the original one). 
Once modified, we need to sync it with all its duplicates.
On delete, we should clean all registered duplicates.






1.9.0

- Inews-service refactored to class module. I ready now to focus on duplicates.

1.8.8

- Implemented scenes and folder names normalizer
- Implemented color code on scenes - based on scene.color from API.


1.8.7

- Implemented bootstrap nested accordion that sorts templates in scenes and folders structure. 
Style parameters are overrides bootstrap defaults, they are fully cusmozible - there is 2 separated configs for scenesAccordion and foldersAccordion (menu.css)

```
Logic:

Data Initialization:

Initialize productionsData array to store fetched data.
Fetching Productions:

getProductions(): Fetch productions data from the API and populate the production selector dropdown.
Fetching Templates:

getTemplates(): On user selection, fetch templates for the chosen production.
Create scene accordion items, each containing nested folder accordion items.
Creating Accordion Items:

createAccordionItem(): For each scene, create a scene accordion item with unique IDs.
createFolderAccordionItem(): For each folder in a scene, create a folder accordion item with unique IDs, and inject the corresponding templates.
Injecting Templates:

createTemplateHtml(): Create and inject HTML for each template within the folder accordion items.
```

- Minor style improvements.
- Added logger - all prints going thru logger func, that adds timestamp.

1.8.6

- Implemented favorites modifier key - for key combination
- Implemented comment field in config.json - for custom user data

The new structure is:

```
    "favorites":[
        {"name":"אצבע","id":10003, "key": "1"},
        {"name":"סופר אישיות","id":10004, "key": "2"},
        {"name":"2סופר אישיות","id":60032, "key": "x"}
    ],
    "favoritesModifier":"alt",
    "comment": [
        "possible modifiers: alt, ctrl, shift",
        "other comment for user use.."
    ]
```

1.8.5

- Implemented bootstrap spinner with fixed show time (500). 
Timeout can be adjusted in renderTemplate function.

1.8.4

- Renamed the new function to "Favorites"
- Implemented keyboard key-trigger (skips all "input fields).
- New config.json struct for favorites:
  ``  "favorites":[
        {"name":"אצבע","id":10003, "key": "1"},
        {"name":"סופר אישיות","id":10004, "key": "2"},
        {"name":"2סופר אישיות","id":60032, "key": "3"}
    ]``

- Data is fetched from config.json:
    "templatesLinks":[
        {"templateName":"אצבע","templateId":10003},
        {"templateName":"סופר אישיות","templateId":10004},
        {"templateName":"2סופר אישיות","templateId":60032}
    ]
    

1.8.3

- Added link button with links to popular templates 
- Data is fetched from config.json:
    "templatesLinks":[
        {"templateName":"אצבע","templateId":10003},
        {"templateName":"סופר אישיות","templateId":10004},
        {"templateName":"2סופר אישיות","templateId":60032}
    ]
    
1.8.2

- Payload size limit increased to 50 MB.
- Bootstrap removed from iframe (and also unused modal).

1.8.1

- Limit for 40 chars at item name

1.8.0

- Modal with predefined items links added.

1.7.9

- Cleared from unused build tools installations
- Implemented block mechanism to filter same 2 messages from inews (50 ms block)
- Implemented UpdateNameEvent listener to trigger header name update from template updateName() event dispatch. Now, the problem with "what is the right input field for item name?" is solved - i just got trigger from template.
- Focus on item load is partially solved.

1.7.8

- Implemented page number column handling


1.7.5

- Fixed item reorder (implemented counter in xmlToJson.js in inews library, and in my parser).


1.7.4

- Added stor method in inews library (in both inewsClient.js and inewsConnectionClient.js).

1.7.3

- Wrapping NA_setValue in try catch, to avoid crushing in some minor cases (my scripts conflicting with template embedded scripts) 

Maybe the better way is to inject my script file before template embedded scripts..

1.7.2

- Fix for single quote data input

1.7.1
- Added input field that updates onKeyup, and when user hit "save" actually its value will be stored as name. 
When user open item, sql service will return this name, so we will see it. On any change, it will be automatically returned to static header+ first input field. So, the only thing that i have to add here, is some lock btn to disable name change, in case the name is custom and user still want to edit some gfx data on item

1.7.0

- Added static header to item name (can be seated in addItemCategoryName config)

1.6.9

- Ignore not enabled templates
- onChange listener with debounce for preview server
- Removed un-necessary "make-copy".
- Added "reset prw"  button.

1.6.6

- Hide un-watched rundowns (enabled=0) on app load.
- Implement new column "floating" in ngn_inews_stories.
- "Make copy" button added on plugin-panel.
- FTP client can set SITE FORMAT now, so its independent from inews site config. The optimal for us is "3nsml".
The setting can be changed in config.json
- In edit mode, "back" button is hidden.
- When user try to open item that was deleted in db, he got error message (sql getItemData method returns "N/A" in this case).
- Implemented new items hashmap to handle in use items globally in all watched rundowns. So, if user duplicate story, with the same items, and then delete one of those stories, inews-connect wont delete the item in the deleted stories, because in hash we count item use. It will delete the item only of its count will be 0. To handle it, hash class has add, remove, and isUsed methods. 
   * We add to hash in items service => create item event, and in sql service => addDbStory. 
   * We remove from cache in sql service => deleteItem.
   * We use isUsed method to check if item can be deleted in sql service => deleteItem.
- Implemented handling for "unlinked items" - those who has been saved in db but not inews. 
Unlinked item-list backed up in json file. 
Scheduled task updates the json file every 10 mins. 
On load, inews-connect loads those items from cache file. 
In future, its possible to clear db based on unlinked list.
   
1.6.5
- Plugin works.
- hasAttachments() method added in inews-cache class.
- We don't perform lineupExist() check anymore (increase performance).
- Attachments parser can handle 2 types of MOS messages (edited item has different structure).
- Iframe js file renamed to "iframe.js".
- Handle "enabled" based on attachments. Still write all stories to db.
- Added copy to clipboard option to copy items from stand-alone browser into inews.
- Added float story handling

1.6.4
- Storing parsed attachments as : attachments{ gfxItem {gfxTemplate, gfxProduction, itemSlug, ord} }.
- Item service handles create andd reorder items. then, its call sql updateItem/updateItemOrd to update item in db. Then, cache the story.
- Added getStoryAttachments in inews-service.
- Sql-service func ordered by categories.
- Added parseAttachments in xmlParser utility module.
- Returned config.json and deleted yaml kombina.

1.6.3
- Config.yaml instead json

1.6.2
- Store item refactor
- Item handling moved to sql-service and chained to story events
- Added handling for attachment type .includes("<gfxProduction>").
- Items processor. Handles item create, modify, reorder and delete actions.

1.6.1
- The Inews-cache module has been implemented with support for all caching stores and methods.
- Conducted horizontal development across the project, including module renaming and file deletions.
- Cache data structures documented.

1.6.0
- Implemented parallel ftp connections 
- Caching mechanism from scratch rebuild.
- HTML injector for templates, merge plugin js with templates js automatically by link js files(utilities/file-processor.js).
- REST routes for plugin.
- Bootstrap grid implemented.
- Many other structure and code changes, merges and improvements.

1.5.0
- Inews-connect works with mssql. 
- I fetching the whole stories table once on each rundowns iteration, store it in storiesCache (overwrite), then compare stories from inews to the cache. 
- CheckStory is checking if its new story/reorder/modify. 
- Sql service have simplified methods to mssql (I avoided complicated merges and joins...). 
- config.json including now production value and uid placeholder for each rundown (Data structure change).
- Added storiesCache module with single setter and getter.
- Stories cache structure:
[
  {
    uid: '3124',
    name: '4',
    lastupdate: '1702161927',   
    rundown: '1091',
    production: '1',
    ord: 0,
    ordupdate: '1702161927',    
    enabled: true,
    tag: '',
    identifier: '046B337E',     
    locator: '0002B980:6574ECB8'
  },
.
.
.
]
- Rundowns structure (from config.json):
{
  'SHOW.ALEX.RUNDOWN': { production: 1, uid: '1097' },
  'SHOW.ALEX.RUNDOWN2': { production: 1, uid: '1098' }
}


1.2
- Inews-connect now serving plugin webpage on http://server-ip-addr:3000/index.html
- Data are stored in gfx server - inews storing only the ids. When open item from inews, the plugin receive element id => send this id to gfx server (now its emulator), and receives the element that user see on page.
- Plugin interacts with with db-emulator (that emulate gfx elements play-out server) in those schemas:

Open gfx item from Inews:

![](docs/plugin%20open%20from%20inews.bmp)

Save gfx item to Inews (drag&drop/ apply/ ok):


![](docs/plugin%20save%20to%20inews.bmp)
1.1.1
- Fixed lineup validation
- Story changes now based on story locator (and not on modified date)


1.1
- Layered architecture:
    * Dal layer - inews-ftp and local-store class with datastore methods (including activeLineup).
    * Separated App config that loads config.json
    * No globals anymore
    * Cleanups
    
1.0.2
- Added utilities/lineup-validator.js script that fix the bug related to inews ftp plugin, 
that if user try to access path that does"t exists, its crush the process.
- Separate inews service and rest service.

1.0.1
- Fixed conversion of Hebrew string (added utilities/hebrew-decoder.js)

1.0
Init app with ftp client plugin, config file and basic REST API func. 

REST API:
- User can set active lineup (if lineup doesn't exists, app crushes, need bo be fixed), 
POST: localhost:3000/api/services/set-watcher/path-to-needed-lineup

- Get current watched lineup in json format:
GET: localhost:3000/api/watcher

- Get folders list: 
GET: localhost:3000/api/services/get-dir/path-to-folder


---
apostrof
template name on item
on delete, ignore it
edit item name in html