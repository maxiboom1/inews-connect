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

function parseAttachments(attachments) {
    const obj = {};
    for (const a in attachments) {
      if (attachments[a].includes("<gfxProduction>")) {
        const parser = new XMLParser();
        let jObj = parser.parse(attachments[a]);
        const item = jObj.AttachmentContent.mos.ncsItem.item;

        // Create a new object with only the specified properties
        obj[item.gfxItem] = {
          gfxTemplate: item.gfxTemplate,
          gfxProduction: item.gfxProduction,
          itemSlug: item.itemSlug,
          ord: item.itemID
        };
      }
    }

    return obj;
}



export default {parseXmlString, parseXmlForReorder,parseAttachments};


/*
Example attachment:

<AttachmentContent><mos>
                <ncsItem>
                        <item>
                                <itemID>1</itemID>
                                <itemSlug>asd</itemSlug>
                                <objID>12345</objID>
                                <mosID>iNEWSMOS1</mosID>
                                <mosItemBrowserProgID>alex</mosItemBrowserProgID>
                                <mosItemEditorProgID>alexE</mosItemEditorProgID>
                                <mosAbstract>asd</mosAbstract>
                                <group>1</group>
                                <gfxItem>102</gfxItem>
                                <gfxTemplate>10005</gfxTemplate>
                                <gfxProduction>2</gfxProduction>
                        </item>
                </ncsItem>
        </mos></AttachmentContent>
*/