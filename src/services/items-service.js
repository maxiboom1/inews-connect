import inewsCache from "../1-dal/inews-cache.js";
import xml from "../utilities/xml-parser.js";
import sqlService from "./sql-service.js";

// Extracts the necessary IDs from the XML string
const _extractIds = (xmlString) => {
    const { ord, itemId } = xml.parseXmlString(xmlString);
    return { order: ord, gfxItemId: itemId };
};

// Checks for reorder event
const _checkForReorder = (inewsXml, cacheAttachments, inewsOrder, events) => {
    let isReorder = false;
    for (const [cacheOrder, cacheXml] of Object.entries(cacheAttachments)) {
        const { gfxItemId: cacheGfxItemId } = _extractIds(cacheXml);

        if (_extractIds(inewsXml).gfxItemId === cacheGfxItemId) {
            const inewsParsedForReorder = xml.parseXmlForReorder(inewsXml);
            const cacheParsedForReorder = xml.parseXmlForReorder(cacheXml);
            console.log(inewsParsedForReorder, cacheParsedForReorder);

            if (JSON.stringify(inewsParsedForReorder) === JSON.stringify(cacheParsedForReorder)) {
                events.push({ action: 'reorder', oldKey: cacheOrder, newKey: inewsOrder });
                isReorder = true;
                break;
            }
        }
    }
    return isReorder;
};

// Creates an item
const _createItem = async (rundownStr, inewsOrder, story, inewsGfxItemId) => {
    const rundownId = await inewsCache.getRundownUid(rundownStr);
    const storyId = await inewsCache.getStoryUid(rundownStr, story.identifier);
    const item = {
        ord: inewsOrder,
        storyId: storyId, 
        itemId: inewsGfxItemId, 
        rundownId: rundownId
    };
    console.log(item);
    await sqlService.updateItem(rundownStr, item);
    
};

// Its triggered while inews story has been modified
async function compareItems(rundownStr, story) {
    const cachedStory = await inewsCache.getStory(rundownStr, story.identifier);
    const cacheAttachments = cachedStory.attachments;
    const inewsAttachments = story.attachments;

    const events = [];

    for (const [inewsOrder, inewsXml] of Object.entries(inewsAttachments)) {
        const { order: inewsOrd, gfxItemId: inewsGfxItemId } = _extractIds(inewsXml);

        if (!cacheAttachments.hasOwnProperty(inewsOrder)) {
            // Item created
            if (!_checkForReorder(inewsXml, cacheAttachments, inewsOrder, events)) {
                events.push({ action: 'create', key: inewsOrder });
                await _createItem(rundownStr, inewsOrd, story, inewsGfxItemId);
            }
        } else {
            if (cacheAttachments[inewsOrder] !== inewsXml) {
                events.push({ action: 'modify', key: inewsOrder });
            }
        }
    }

    for (const cacheOrder of Object.keys(cacheAttachments)) {
        if (!inewsAttachments.hasOwnProperty(cacheOrder)) {
            events.push({ action: 'delete', key: cacheOrder });
            // Delete item from db with uid 
        }
    }

    console.log(events);
    return events;
}

export default { compareItems };
