const originUrl = window.location.origin;
document.getElementById('productionSelector').addEventListener('change', getTemplates);
var iframe = document.getElementById('contentIframe');
/*
iframe.onload = function() {
    iframe.contentWindow.test();
};
*/

// ******************************************* Menu functions *******************************************
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
        el.addEventListener('click', () => renderTemplate(el.id));
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

// ******************************************* Comm with inews wrapper logics *******************************************

async function mosMsgFromHost(event) {
    var message = event.data;
    console.log(message);
    if (event.origin != getNewsroomOrigin()) { 
        return; 
    }
    
    // User opened item 
    if (message.indexOf('<ncsItem>') !== -1){
        const templateId = extractTagContent(message, "gfxTemplate");
        const gfxItem = extractTagContent(message, "gfxItem");
        renderItem(templateId, gfxItem);
    }
    
    // User click apply/ok
    if (message.indexOf('<ncsItemRequest/>') !== -1){
        console.log("got item request");
    }

}

// ******************************************* Iframe logic  *******************************************
function renderTemplate(templateId){
    let url = `${originUrl}/templates/${templateId}.html`;
    const iframe = document.getElementById('contentIframe');
    iframe.src = url; // Set the source of the iframe to the URL  
    iframe.onload = function() {
        iframe.style.display = 'block'; // Show the iframe
    };
}

async function renderItem(templateId,gfxItem){
    const itemData = await fetchData(`${originUrl}/api/get-item-data/${gfxItem}`, "GET");
    let url = `${originUrl}/templates/${templateId}.html`;
    const iframe = document.getElementById('contentIframe');
    iframe.src = url; // Set the source of the iframe to the URL  
    
    iframe.onload = function() {
        iframe.contentWindow.__NA_SetValues(itemData); // Set item values in template
        iframe.style.display = 'block'; // Show the iframe
        iframe.contentWindow.setGfxItem(gfxItem); // Set gfxItemId in iframe head as "data-gfxitem"
    };
}

function hideIframe() {
    document.getElementById('contentIframe').style.display = 'none';
}

// ******************************************* Utility functions *******************************************

function getNewsroomOrigin() {
    var qs = document.location.search.split("+").join(" ");
    var params = {};
    var regex = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = regex.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params['origin'];
}

function extractTagContent(xmlString, tagName) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      const tagElement = xmlDoc.querySelector(tagName);
  
      if (tagElement !== null) {
        return tagElement.textContent;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
}

async function fetchData(url, method, msg) {
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
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


// Communication listeners with inews
if (window.addEventListener) {
    window.addEventListener('message', mosMsgFromHost, false);
} else if (window.attachEvent) {
    console.log("window.attachEvent");
    window.attachEvent('onmessage', mosMsgFromHost, false);
}
getProductions();

function print(msg){console.log(msg)}