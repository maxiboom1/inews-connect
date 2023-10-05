import { DOMParser, XMLSerializer } from 'xmldom';

function xmlParser(xmlString) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    var itemSlugElements = xmlDoc.getElementsByTagName('itemSlug');

    for (var i = 0; i < itemSlugElements.length; i++) {
        var itemSlugElement = itemSlugElements[i];
        var existingText = itemSlugElement.textContent;
        itemSlugElement.textContent = 'THIS IS FROM SERVER!/n ' + existingText;
    }

    var modifiedXmlString = new XMLSerializer().serializeToString(xmlDoc);

    return modifiedXmlString;
}

function getId(xmlString) {
    const parser = new DOMParser();

    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const gfxItem = xmlDoc.getElementsByTagName('gfxItem')[0];

    if (gfxItem) {
        return gfxItem.textContent;
    } else {
        return null; // Handle the case where <gfxItem> is not found
    }
}

function insertId(xmlString,id) {
    const parser = new DOMParser();

    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const gfxItem = xmlDoc.getElementsByTagName('gfxItem')[0];

    if (gfxItem) {
        xmlDoc.getElementsByTagName('gfxItem')[0].textContent = id;
    } else {
        return null; // Handle the case where <gfxItem> is not found
    }

    var modifiedXmlString = new XMLSerializer().serializeToString(xmlDoc);

    return modifiedXmlString;
}

export default {
    xmlParser,
    getId,
    insertId
}
