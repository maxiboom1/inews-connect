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

**LOGS:**

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