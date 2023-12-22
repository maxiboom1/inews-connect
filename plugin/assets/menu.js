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

    // Create an iframe element
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '90vh';

    // Append the iframe to your container or body
    const container = document.getElementById('iframeContainer');
    container.innerHTML = '';
    container.appendChild(iframe);

    // Communicate between the iframe and the parent
    window.addEventListener('message', receiveMessage, false);

    function receiveMessage(event) {
        // Handle messages sent from the iframe
        if (event.origin === originUrl && event.source === iframe.contentWindow) {
            // Access data from the iframe
            const templateData = event.data;
            console.log('Data received from iframe:', templateData);

            // Optionally, perform actions based on the received data
            // For example, update the original HTML with the data
            // updateOriginalHTML(templateData);

            // Remove the event listener after receiving the data (if needed)
            window.removeEventListener('message', receiveMessage);
        }
    }
}
getProductions();