
var elementId = "";

var dragValue = {value : ''}


async function drag() {  
    console.log("dragStart")
    const id = await sendToGfxServer(finalMsg());  
    dragValue.value = finalMsg(id); 
} 

function dragLeave(event){
    event.dataTransfer.setData("text/plain",dragValue.value );
    console.log(event.dataTransfer.getData("text/plain"));
}

function drop(event) {
    console.log(event.dataTransfer.getData("text/plain"));
    dragValue.value = ""; // Clear the dragValue
}

function finalMsg(gfxId =""){
    var group = document.getElementById("group").value;
    var gfxItem = document.getElementById("gfxItem").value;
    var payload = document.getElementById("payload").value;

    var finalMsg = 
    `<mos>
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
                <gfxItem>${gfxId.id}</gfxItem>
            </item>
        </ncsItem>
    </mos>`;
    return finalMsg;
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
    sendToGfxServer("<msg>mosMsgFromPlugIn</msg>");
    window.parent.postMessage(message, getNewsroomOrigin());
}

function mosMsgFromHost(event) {
    var message = event.data;
    sendToGfxServer("mosMsgFromHost");
    //----------------Message parser (Alex)
    if (message !== "<mos><ncsItemRequest/></mos>"){
        var payload1 = message.slice(message.indexOf("itemSlug>")+9, message.indexOf("</itemSlug>"));
        var group1 = message.slice(message.indexOf("group>")+6, message.indexOf("</group>"));
        var gfxItem1 = message.slice(message.indexOf("gfxItem>")+8, message.indexOf("</gfxItem>"));
        document.getElementById("payload").value = payload1;
        document.getElementById("group").value = group1;
        document.getElementById("gfxItem").value = gfxItem1;
    } else {
        sendToGfxServer('<msg>APPLY/SAVE</msg>');// HERE USER ARE CLICK "APPLY"/"OK"
    }

    if (event.origin != getNewsroomOrigin()) {return;}
    
    if (message.indexOf('<ncsAck>') === -1){
        event.source.postMessage("<mos><ncsAck><status>ACK</status></ncsAck></mos>", event.origin);
    }
    
    if (message.indexOf('<ncsItemRequest>') === -1){event.source.postMessage(finalMsg(), event.origin);}

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

if (window.addEventListener) {
    sendToGfxServer("<msg>USER OPENED GFX IN NCS</msg>");
    window.addEventListener('message', mosMsgFromHost, false);
} else if (window.attachEvent) {
    sendToGfxServer("<msg>2</msg>");
    window.attachEvent('onmessage', mosMsgFromHost, false);
}
