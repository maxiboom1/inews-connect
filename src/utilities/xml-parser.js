import {XMLParser} from "fast-xml-parser";

function parseXmlString(XMLdata) {
    const parser = new XMLParser();
    let jObj = parser.parse(XMLdata);
    const item = jObj.AttachmentContent.mos.ncsItem.item;
    return {
      ord: item.itemID, 
      itemId: item.gfxItem
    };
  }
  
function parseXmlForReorder(XMLdata) {
  const parser = new XMLParser();
  let jObj = parser.parse(XMLdata);
  const item = jObj.AttachmentContent.mos.ncsItem.item;
  delete item.gfxItem; // Remove gfxItem for reorder comparison
  return item;
}
export default {parseXmlString, parseXmlForReorder};
