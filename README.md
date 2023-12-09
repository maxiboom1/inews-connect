Inews-connect 1.2

TODO: fetch flag from story - is it dir or queue.
TODO: Refactor plugin functions.

Releases:

1.5.0
- Inews-connect works with mssql. 
- I fetching the whole stories table once on each rundowns iteration, store it in storiesCache (overwrite), then compare stories from inews to the cache. - CheckStory is checking if its new story/reorder/modify. 
- Sql service have simplified methods to mssql (I avoided complicated merges and joins...). 
- config.json including now production value and uid placeholder for each rundown (Data structure change).

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


