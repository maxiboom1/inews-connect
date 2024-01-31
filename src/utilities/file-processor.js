import { promises as fsPromises } from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { JSDOM } from 'jsdom';
import appConfig from './app-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 
 * Gets templates array @param templates. Takes template.source and injects scripts, css link and plugin panel.
 * Then, we store modified HTML in plugin/assets/templates, as [template.name].html.
 * Delete template.source from template. 
 * @return templates array without source prop.
 */
async function processAndWriteFiles(templates) {
    
    const templatesFolder = path.resolve(__dirname, "../../plugin/templates");
    try {
        await fsPromises.access(templatesFolder);
    } catch (error) {
        await fsPromises.mkdir(templatesFolder);
    }

    for (const template of templates) {
        const { uid, source, name, production } = template;
        const injectedHtml = htmlWrapper(source,uid, production);
        const filePath = path.join(templatesFolder, `${uid}.html`);
        await fsPromises.writeFile(filePath, injectedHtml, 'utf-8');
        delete template.source;
        console.log(`Loaded ${name} template`);
    }

    return templates;
}

function htmlWrapper(htmlContent,templateUid, productionUid) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const scriptFileName = "../assets/iframe.js";

    const scriptTag = document.createElement('script');
    scriptTag.src = scriptFileName;

    // Create style tag to link external CSS file
    const styleTag = document.createElement('link');
    styleTag.rel = 'stylesheet';
    styleTag.href = "../assets/iframe.css";

    const pluginPanelDiv = createPluginPanel(document);
    const toolboxContentDiv = document.querySelector('.toolbox-title');

    if (toolboxContentDiv) {
        toolboxContentDiv.appendChild(pluginPanelDiv);
    } else {
        document.body.appendChild(pluginPanelDiv);
    }

    document.body.appendChild(scriptTag);
    document.head.appendChild(styleTag);
    document.body.setAttribute('data-template', templateUid);  
    document.body.setAttribute('data-production', productionUid);    
  
    return dom.serialize();
}

function createPluginPanel(document) {
    // Create back btn
    const backButton = document.createElement('button');
    backButton.textContent  = 'Back';
    backButton.id = 'navigateBack';
    backButton.classList.add('pluginPanelBtn'); // Add the class to the back button

    // Create save btn
    const saveButton = document.createElement('button');
    saveButton.textContent  = 'Save';
    saveButton.id = 'save';
    saveButton.classList.add('pluginPanelBtn'); // Add the class to the save button

    //Create preview btn
    const previewButton = document.createElement('button');
    previewButton.textContent  = 'Preview';
    previewButton.id = 'preview';
    previewButton.setAttribute("data-preview-host", appConfig.previewServer);
    previewButton.setAttribute("data-preview-port", appConfig.previewPort);
    previewButton.classList.add('pluginPanelBtn'); // Add the class to the save button

    // Create drag btn
    const dragButton = document.createElement('button');
    dragButton.textContent  = 'Drag';
    dragButton.id = 'drag';
    dragButton.draggable = true; // Set the draggable attribute
    dragButton.classList.add('pluginPanelBtn'); // Add the class to the save button

    // Create div with id "pluginPanel"
    const pluginPanelDiv = document.createElement('div');
    pluginPanelDiv.id = 'pluginPanel';
    pluginPanelDiv.classList.add('pluginPanel'); // Add the class to the pluginPanel div

    // Append buttons to the "pluginPanel" div
    pluginPanelDiv.appendChild(backButton);
    pluginPanelDiv.appendChild(saveButton);
    pluginPanelDiv.appendChild(previewButton);
    pluginPanelDiv.appendChild(dragButton);
    //pluginPanelDiv.appendChild(previewButton);

    return pluginPanelDiv;
}

export default processAndWriteFiles;
