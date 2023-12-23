//document.querySelector("#payload").addEventListener('change', showSaveButton);
document.querySelector("#save").addEventListener('click', clickOnSave);

function showSaveButton(){document.getElementById("save").style.display = 'block'; hideDragButton();}
function hideSaveButton(){document.getElementById("save").style.display = 'none';}
function showDragButton(){document.getElementById("drag").style.display = 'block'; hideSaveButton();}
function hideDragButton(){document.getElementById("drag").style.display = 'none';}
console.log("XOXOX");

let currentId = {id:null};

async function clickOnSave(){
    try{
        currentId = await sendToGfxServer(createMosMessage());
        showDragButton();
    }catch(err){
        console.error("Failed to post data");
    }
}

function drag(event) {  
    event.dataTransfer.setData("text/plain",createMosMessage());
}

function drop() {
    currentId.id = null;
    hideDragButton();
    hideSaveButton();
}

function createMosMessage(){
    const group = document.getElementById("group").value;
    const payload = document.getElementById("payload").value;
    message = `<mos>
        <ncsItem>
            <item>
                <itemID>0</itemID>
                <itemSlug>${payload}</itemSlug>
                <objID>12345</objID>
                <mosID>iNEWSMOS1</mosID>
                <mosItemBrowserProgID>alex</mosItemBrowserProgID>
                <mosItemEditorProgID>alexE</mosItemEditorProgID>
                <mosAbstract>${payload}</mosAbstract>
                <group>${group}</group>
                <gfxItem>${currentId.id}</gfxItem>
            </item>
        </ncsItem>
    </mos>`;
    return message;
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

function mosMsgFromPlugIn(message) {
    console.log("SHOOOO>>>>");
    window.parent.postMessage(message, getNewsroomOrigin());
}

async function mosMsgFromHost(event) {
    var message = event.data;
    // OPEN ITEM
    if (message !== "<mos><ncsItemRequest/></mos>"){
        await userOpenedItem(message);
        return;
    }
    
    // HERE USER IS CLICKING "APPLY"/"OK"
    if(message === "<mos><ncsItemRequest/></mos>"){
        await sendToGfxServer(createMosMessage());
    }

    if (event.origin != getNewsroomOrigin()) { 
        return; 
    }
    // SEND 
    if (message.indexOf('<ncsItemRequest>') === -1){
        event.source.postMessage(createMosMessage(), event.origin);
    }
}

async function userOpenedItem(message){
    
    // Get gfxItem from inews
    var gfxItem = extractTagContent(message, "gfxItem");
    
    // Store gfxItem
    currentId.id = gfxItem;
    
    // Get element with gfxItem id from gfx server       
    const elementFromServer = await getFromGfxServer(gfxItem);

    // Get and render data
    var payload = extractTagContent(elementFromServer, "itemSlug");  
    var group = extractTagContent(elementFromServer, "group");  
    document.getElementById("payload").value = payload;
    document.getElementById("group").value = group;
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

async function sendToGfxServer(msg) {
    const url = 'http://localhost:3000/plugin/gfx'; // Replace with your API URL
    return await fetchData(url, 'POST', msg);
}

async function getFromGfxServer(id) {
    const url = `http://localhost:3000/plugin/gfx/${id}`;
    return await fetchData(url, 'GET', null);
}

async function sendNotify(msg) {
    const url = 'http://localhost:3000/plugin/debug'; // Replace with your API URL
    await fetchData(url, 'POST', msg);
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

if (window.addEventListener) {
    console.log("window.addEventListener");
    window.addEventListener('message', mosMsgFromHost, false);
} else if (window.attachEvent) {
    console.log("window.attachEvent");
    window.attachEvent('onmessage', mosMsgFromHost, false);
}

