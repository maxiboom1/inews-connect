Inews-connect 1.1.1

TODO: fetch flag from story - is it dir or queue
TODO: Try to understand plugin
Releases:

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
that if user try to access path that doesn"t exists, its crush the procces.
- Separate inews service and rest service.

1.0.1
- Fixed conversion of Hebrew string (added utilities/hebrew-decoder.js)

1.0
Init app with ftp client plugin, config file and basic REST API func. 

REST API:
- User can set active lineup (if lineup doesnt exists, app crushes, need bo be fixed), 
POST: localhost:3000/api/services/set-watcher/path-to-needed-lineup

- Get current watched lineup in json format:
GET: localhost:3000/api/watcher

- Get folders list: 
GET: localhost:3000/api/services/get-dir/path-to-folder


