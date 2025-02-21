import { XMLParser } from "fast-xml-parser";
import itemConstructor from "./item-constructor.js";

/** 
 * Gets inews raw story and returns parsed attachments.
 * @returns - {"uuid": ItemModel}
 */
function parseAttachments(story) {
    const attachments = story.attachments;
    const obj = {};

    for (const a in attachments) {
        if (attachments[a].includes("<uuid>")) {
            const parser = new XMLParser();
            let jObj = parser.parse(attachments[a]);
            let item;
            if (jObj.AttachmentContent.mos.ncsItem) {
                // Type 1 XML
                item = jObj.AttachmentContent.mos.ncsItem.item;
            } else {
                // Type 2 XML
                item = jObj.AttachmentContent.mos;
            }
            // Create a new object with only the specified properties
            obj[item.mosExternalMetadata.uuid] = {
                template: item.mosExternalMetadata.template,
                production: item.mosExternalMetadata.production,
                name: item.itemSlug,
                ord: a,
                data: item.mosExternalMetadata.data,
                scripts: item.mosExternalMetadata.scripts,
                uuid: item.mosExternalMetadata.uuid
            };

        }
    }
    return obj;
}

export default { parseAttachments };