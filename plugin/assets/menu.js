const originUrl = window.location.origin;
document.getElementById('productionSelector').addEventListener('change', getTemplates);

async function getProductions() {
    const url = `${originUrl}/api/productions`; 
    const productions = await fetchData(url, 'GET',null);
    const productionSelector = document.getElementById('productionSelector');

    productions.forEach(function(production) {
        var option = document.createElement('option');
        option.value = production.uid;
        option.text = production.name;
        productionSelector.add(option);
    });

}

async function getTemplates() { 
    const productionUid = document.getElementById('productionSelector').value;
    if (productionUid === "") return;
    const url = `${originUrl}/api/templates/${productionUid}`;
    const templates = await fetchData(url, 'GET', null);
    const templatesContainer = document.getElementById('templatesContainer');
    templatesContainer.innerHTML = '';

    templates.forEach(function (template) {
        const el = createTemplateHtml(template);
        el.addEventListener('click', () => navigate(el.id));
        templatesContainer.appendChild(el);
    });
}

function createTemplateHtml(template){
    const container = document.createElement('div'); // Create a temporary container
    if(template.icon){
        container.innerHTML = `
        <div id=${template.uid} class="col-1 themed-grid-col">
            <img src='data:image/png;base64,${template.icon}' alt='Template Icon'>
        </div>`;
    } else {
        container.innerHTML = `
        <div id=${template.uid} class="col-1 themed-grid-col">
        ${template.name}
        </div>`;
    }

    // Return the first child of the container
    return container.firstElementChild;
}

async function fetchData(url, method, msg) {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'text/plain', // Adjust content type as needed
            },
            body: msg,
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error(`Failed to ${method} data at URL: ${url}`);
        }
    } catch (error) {
        console.error(`Error while fetching data at URL: ${url}`, error);
    }
}
function navigate(templateId){
    const url = `${originUrl}/templates/${templateId}.html`; 
    window.location.href = url;   
}
getProductions();