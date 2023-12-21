import { promises as fsPromises } from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function processAndWriteFiles(templates) {
    
    const templatesFolder = path.resolve(__dirname, "../assets/templates");

    try {
        await fsPromises.access(templatesFolder);
    } catch (error) {
        await fsPromises.mkdir(templatesFolder);
    }

    for (const template of templates) {
        const { uid, source, name } = template;
        const filePath = path.join(templatesFolder, `${uid}.html`);
        await fsPromises.writeFile(filePath, source, 'utf-8');
        delete template.source;
        console.log(`Loaded ${name} template`);
    }

    return templates;
}

export default processAndWriteFiles;
