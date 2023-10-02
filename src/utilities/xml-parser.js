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

export default xmlParser;
