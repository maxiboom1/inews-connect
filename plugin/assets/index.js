document.querySelector("#payload").addEventListener('change', showSaveButton);
document.querySelector("#save").addEventListener('click', clickOnSave);
let dataFromServer = {id:null};
function showSaveButton(){document.getElementById("save").style.display = 'block'; hideDragButton();}
function hideSaveButton(){document.getElementById("save").style.display = 'none';}
function showDragButton(){document.getElementById("drag").style.display = 'block'; hideSaveButton();}
function hideDragButton(){document.getElementById("drag").style.display = 'none';}

async function clickOnSave(){
    try{
        dataFromServer = await sendToGfxServer(createMosMessage());
        console.log(dataFromServer);
        showDragButton();
    }catch(err){
        console.error("Failed to post data");
    }
}

function drag(event) {  
    event.dataTransfer.setData("text/plain",createMosMessage());
}

function drop() {
    dataFromServer.id = null;
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
                <gfxItem>${dataFromServer.id}</gfxItem>
            </item>
        </ncsItem>
    </mos>`;
    console.log("constructor: ", dataFromServer.id);
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
    sendNotify("mosMsgFromPlugIn");
    window.parent.postMessage(message, getNewsroomOrigin());
}

async function mosMsgFromHost(event) {
    var message = event.data;
    // OPEN ITEM
    if (message !== "<mos><ncsItemRequest/></mos>"){
        
        var gfxItem = message.slice(message.indexOf("gfxItem>")+8, message.indexOf("</gfxItem>"));        
        const elementFromServer = await getFromGfxServer(gfxItem);
        dataFromServer.id = gfxItem;
        var payload = elementFromServer.slice(elementFromServer.indexOf("itemSlug>") + 9, elementFromServer.indexOf("</itemSlug>"));
        var group = elementFromServer.slice(elementFromServer.indexOf("group>") + 6, elementFromServer.indexOf("</group>"));

        document.getElementById("payload").value = payload;
        document.getElementById("group").value = group;
    }

    if (event.origin != getNewsroomOrigin()) { return; }
    
    // HERE USER IS CLICKING "APPLY"/"OK"
    if(message === "<mos><ncsItemRequest/></mos>"){
        await sendToGfxServer(createMosMessage());
    }

    // Candidate to fuck off
    if (message.indexOf('<ncsAck>') === -1){
        event.source.postMessage("<mos><ncsAck><status>ACK</status></ncsAck></mos>", event.origin);
    }
    
    if (message.indexOf('<ncsItemRequest>') === -1){
        event.source.postMessage(createMosMessage(true), event.origin);
    }
}

async function sendToGfxServer(msg) {

    var url = 'http://localhost:3000/plugin/gfx'; // Replace with your API URL
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Adjust content type as needed
            },
            body: msg,
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Failed to post data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getFromGfxServer(id) {
    var url = 'http://localhost:3000/plugin/gfx/' + id; 
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain', // Adjust content type as needed
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Failed to get data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function sendNotify(msg) {
    var url = 'http://localhost:3000/plugin/debug'; // Replace with your API URL
    try {
        await fetch(url, {method: 'POST',headers: {'Content-Type': 'text/plain', },body: msg,});
    } catch (error) {
        console.error('Error:', error);
    }
}

if (window.addEventListener) {
    sendNotify("window.addEventListener");
    window.addEventListener('message', mosMsgFromHost, false);
} else if (window.attachEvent) {
    sendNotify("window.attachEvent");
    window.attachEvent('onmessage', mosMsgFromHost, false);
}
