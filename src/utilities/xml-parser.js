import { DOMParser, XMLSerializer } from 'xmldom';

function xmlParser(xmlString) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Find the <itemSlug> element and add the "debug:" prefix
    var itemSlugElements = xmlDoc.getElementsByTagName('itemSlug');

    for (var i = 0; i < itemSlugElements.length; i++) {
        var itemSlugElement = itemSlugElements[i];
        var existingText = itemSlugElement.textContent;
        itemSlugElement.textContent = 'THIS IS FROM SERVER!/n ' + existingText;
    }

    // Serialize the modified XML back to a string
    var modifiedXmlString = new XMLSerializer().serializeToString(xmlDoc);

    return modifiedXmlString;
}

function getId(xmlString) {
    const parser = new DOMParser();

    // Parse the XML string into a DOM document
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Extract the data within the <gfxItem> tag
    const gfxItem = xmlDoc.getElementsByTagName('gfxItem')[0];

    if (gfxItem) {
        return gfxItem.textContent;
    } else {
        return null; // Handle the case where <gfxItem> is not found
    }
}

export default {
    xmlParser,
    getId,
}
