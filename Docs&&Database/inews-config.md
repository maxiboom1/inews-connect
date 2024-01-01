There is number of configurations in inews:
I have local inews server ver MCNM_v2021.7
1. Server-side configuration
The information for each plugin is stored as a story to a dedicated queue. The server-side configuration 
allows you to specify an alternative queue-name in /site/dict/queues. Make sure there is an line:

Q_HTML_PLUGINS /system.html-plugins

2. Each plugin is configured using a story in the queue SYSTEM.HTML-PLUGINS (default location). The 
content of each story follows the below schema (those are basic settings):

URL = https://222.22.222.222:2222/
mosItemBrowserProgID = someMOSPlugin.Browser
mosItemPlayerProgID = someMOSPlugin.Player
mosItemEditorProgID = someMOSPlugin.Editor

3. In the story SYSTEM.MOS-MAP, add a line, such as:
iNEWSMOS1 iNEWSTest1
"iNEWSMOS1 should be the same as <mosID> tag in mos message.

4. FTP SITE FORMAT (Server-side configuration)
FORMAT is used to specify the format to be used when sending stories to the client. This parameter can be 
set to nsml, 2nsml, 3nsml, or 3.1nsml. The default is NSML ==> Which not includes attachments, so we wont get the GFX items!

You can control some of the behavior of rxnet by putting some environment variable settings in the
/site/env/rxnet file.

RXSITEFORMAT=<format>

The 3nsml format is fine for us - it have attachments, and not have fields with lots of unused info.



