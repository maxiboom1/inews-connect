import { promises as fsPromises } from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function processAndWriteFiles(templates) {
    
    const templatesFolder = path.resolve(__dirname, "../../plugin/templates");
    try {
        await fsPromises.access(templatesFolder);
    } catch (error) {
        await fsPromises.mkdir(templatesFolder);
    }

    for (const template of templates) {
        const { uid, source, name } = template;
        const injectedHtml = addScriptTagToHTML(source);
        const filePath = path.join(templatesFolder, `${uid}.html`);
        await fsPromises.writeFile(filePath, injectedHtml, 'utf-8');
        delete template.source;
        console.log(`Loaded ${name} template`);
    }

    return templates;
}

function addScriptTagToHTML(htmlContent) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const scriptFileName = "assets/index.js";
    // Create the script element
    const scriptTag = document.createElement('script');
    scriptTag.src = scriptFileName;
    
    // Append the script tag to the head of the document
    document.head.appendChild(scriptTag);
    
    // Return the updated HTML content
    return dom.serialize();
}

export default processAndWriteFiles;
