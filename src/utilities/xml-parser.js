import { XMLParser } from "fast-xml-parser";
import itemConstructor from "./item-constructor.js";


function parseAttachments(story) {
  const attachments = story.attachments;
  const obj = {};

  for (const a in attachments) {
    if (attachments[a].includes("<gfxProduction>")) {
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
      obj[item.gfxItem] = itemConstructor({
        gfxTemplate: item.gfxTemplate,
        gfxProduction: item.gfxProduction,
        name: item.itemSlug,
        ord: a,
        gfxData: item.gfxData,
        gfxScripts: item.gfxScripts,
        uuid:item.gfxItem
      });

    }
  }

  return obj;
}

export default { parseAttachments };

