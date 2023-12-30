document.getElementById('productionSelector').addEventListener('change', getTemplates);
const originUrl = window.location.origin;
const templateId = document.body.getAttribute('data-template');
const productionId = document.body.getAttribute('data-production');
console.log(window.location.href);
//document.getElementById("drag").style.display = 'none';
//document.querySelector("#save").addEventListener('click', clickOnSave);
//document.getElementById('drag').addEventListener('dragstart', drag);
//document.getElementById('drag').addEventListener('dragend', drop);
//document.querySelector("#navigateBack").addEventListener('click', ()=>{
//    window.location.href = window.location.origin; 
//});

function showSaveButton(){document.getElementById("save").style.display = 'block'; hideDragButton();}
function hideSaveButton(){document.getElementById("save").style.display = 'none';}
function showDragButton(){document.getElementById("drag").style.display = 'block'; hideSaveButton();}
function hideDragButton(){document.getElementById("drag").style.display = 'none';}

let gfxElement = {productionId, templateId, itemId:null};


// ******************************************* Common functions *******************************************
async function clickOnSave(){
    try{
        const _NA_Values = __NA_GetValues();// __NA_GetValues exists inline in html
        const _NA_Scripts = __NA_GetScripts();// __NA_GetScripts exists inline in html

        const values = {
            data: _NA_Values,
            scripts: _NA_Scripts,
            templateId: gfxElement.templateId,
            productionId: gfxElement.productionId
        }

        let url= "";
        if(getItemId()){
            url = `${originUrl}/api/update-item/${param}`;
        } else {
            url = `${originUrl}/api/set-item`;
        }
        
        const itemId = await fetchData(url,"POST",JSON.stringify(values)); // Here we get itemId from server
        gfxElement.itemId = itemId;
        console.log(`Returned itemUid ${gfxElement.itemId}`);
        showDragButton();
    }catch(err){
        console.error("Failed to post data");
    }
}

function drag(event) {  
    event.dataTransfer.setData("text/plain",createMosMessage());
}

function drop() {
    gfxElement.templateId = null;
    hideDragButton();
    hideSaveButton();
}

function createMosMessage(){
    let name = "where is the data?";
    if(document.getElementById('stripeText1')){
        name = document.getElementById('stripeText1').value;;
    }
    return `<mos>
        <ncsItem>
            <item>
                <itemID></itemID>
                <itemSlug>${name}</itemSlug>
                <objID>12345</objID>
                <mosID>iNEWSMOS1</mosID>
                <mosItemBrowserProgID>alex</mosItemBrowserProgID>
                <mosItemEditorProgID>alexE</mosItemEditorProgID>
                <mosAbstract>${name}</mosAbstract>
                <group>1</group>
                <gfxItem>${gfxElement.itemId}</gfxItem>
                <gfxTemplate>${gfxElement.templateId}</gfxTemplate>
                <gfxProduction>${gfxElement.productionId}</gfxProduction>
            </item>
        </ncsItem>
    </mos>`;
}

function mosMsgFromPlugIn(message) {
    console.log("SHOOOO>>>>");
    window.parent.postMessage(message, getNewsroomOrigin());
}

async function mosMsgFromHost(event) {
    var message = event.data;
    console.log("MENU: user opened item", message);
    
    // To Reply, issue a postMessage on the event source.
    if (message.indexOf('<ncsAck>') === -1) {
        var reply = "<mos><ncsAck><status>ACK</status></ncsAck></mos>";
        event.source.postMessage(reply, event.origin);
    }

    // OPEN ITEM
    if (message !== "<mos><ncsItemRequest/></mos>"){
        var templateId = extractTagContent(message, "gfxTemplate");
        var itemId = extractTagContent(message, "gfxItem");
        navigate(templateId, itemId); 
    }

    
    if (event.origin != getNewsroomOrigin()) { 
        return; 
    }

    // HERE USER IS CLICKING "APPLY"/"OK"
    if(message === "<mos><ncsItemRequest/></mos>"){
        console.log("SAVEEEEE");
        //await clickOnSave();
        
    }

    // SEND 
    if (message.indexOf('<ncsItemRequest>') === -1){
        console.log("SENDDDD")
        event.source.postMessage(createMosMessage(), event.origin);
    }
}

async function userOpenedItem(message){
    console.log("userOpenedItem");
    // Get gfxItem from inews
    var gfxItem = extractTagContent(message, "gfxItem");
    
    // Store gfxItem
    gfxElement.templateId = gfxItem;
    
    // Get element with gfxItem id from gfx server       
    const elementFromServer = await getFromGfxServer(gfxItem);

    // Get and render data
    var payload = extractTagContent(elementFromServer, "itemSlug");  
    var group = extractTagContent(elementFromServer, "group");  
    document.getElementById("payload").value = payload;
    document.getElementById("group").value = group;
}

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
      // Handle parsing errors here, e.g., return an error message or throw an exception
      return null;
    }
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

function getCurrentTemplateId(){
    // Get the current href
    var currentHref = window.location.href;

    // Extract the template number
    var templateNumber = currentHref.match(/\/templates\/(\d+)\.html/);

    // Check if a match is found
    if (templateNumber && templateNumber.length > 1) {
        var extractedNumber = templateNumber[1];
        console.log(extractedNumber);
    } else {
        console.log("Template number not found in the URL");
    }
}

async function getItemData(){
    
    if(getItemId()){
        const url = `${originUrl}/api/get-item-data/${getItemId()}`;
        const itemData = await fetchData(url, "GET");
        __NA_SetValues(itemData);
    }
    
}

function getItemId(){
    const urlToParse = new URL(window.location.href);
    return urlToParse.searchParams.get('item');
}
// ******************************************* Menu functions *******************************************
async function getProductions() {
    const url = `${originUrl}/api/productions`; 
    const productions = await fetchData(url, 'GET',null);
    const productionSelector = document.getElementById('productionSelector');
    console.log(productions)
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
    console.log(templates)
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
        console.log('x');
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

function navigate(templateId, itemId = undefined){
    let url = `${originUrl}/templates/${templateId}.html`;
    if(itemId){
        url = url + `?item=${itemId}`;
    }

    // Create an iframe element
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', url);
    iframe.style.width = '100%';
    iframe.style.height = '600px'; // Set this to your preferred height

    // Clear the iframeContainer and append the new iframe
    var iframeContainer = document.getElementById('iframeContainer');
    iframeContainer.innerHTML = '';
    iframeContainer.appendChild(iframe);
}


// To handle inews post message when plugin are called from ncs
if (window.addEventListener) {
    console.log("window.addEventListener");
    window.addEventListener('message', mosMsgFromHost, false);
} else if (window.attachEvent) {
    console.log("window.attachEvent");
    window.attachEvent('onmessage', mosMsgFromHost, false);
}

getProductions();
getItemData();