// window.parent.funcName()
// Show/Hide buttons logic
async function clickOnSave(){
    try{
        const values = getItemData(); // returns item{name,data,scripts,templateId,productionId}       
        const gfxItem = await window.parent.fetchData(`${originUrl}/api/set-item`,"POST",JSON.stringify(values));
        setGfxItem(gfxItem);
        showDragButton();
    }catch(err){
        console.error("Failed to post data");
    }
}

// returns item{name,data,scripts,templateId,productionId}
function getItemData(){
        const _NA_Values = __NA_GetValues();
        const _NA_Scripts = __NA_GetScripts();
        const templateId = document.body.getAttribute('data-template');
        const productionId = document.body.getAttribute('data-production');

        return values = {
            //name: slugName(),
            name:document.getElementById("nameInput").value,
            data: _NA_Values,
            scripts: _NA_Scripts,
            templateId: templateId,
            productionId: productionId
        }        
}

function drag(event) { 
    const msg = createMosMessage();
    event.dataTransfer.setData("text/plain",msg);
}

function drop() {
    showSaveButton();
}

function createMosMessage(){
    const templateId = document.body.getAttribute('data-template');
    const productionId = document.body.getAttribute('data-production');
    const gfxItem = document.body.getAttribute('data-gfxItem');
    let itemID = "";
    if(document.body.hasAttribute("data-itemID")){
        itemID = document.body.getAttribute('data-itemID');
    }
    return `<mos>
        <ncsItem>
            <item>
                <itemID>${itemID}</itemID>
                <itemSlug>${document.getElementById("nameInput").value.replace(/'/g, "")}</itemSlug>
                <objID></objID>
                <mosID>iNEWSMOS1</mosID>
                <mosItemBrowserProgID>alex</mosItemBrowserProgID>
                <mosItemEditorProgID>alexE</mosItemEditorProgID>
                <mosAbstract></mosAbstract>
                <group>1</group>
                <gfxItem>${gfxItem}</gfxItem>
                <gfxTemplate>${templateId}</gfxTemplate>
                <gfxProduction>${productionId}</gfxProduction>
            </item>
        </ncsItem>
    </mos>`;
}

function setGfxItem(gfxItem){
    document.body.setAttribute("data-gfxItem",gfxItem);
}

function getGfxItem(){
    return document.body.getAttribute("data-gfxItem");
}
// Internal inews id
function setItemID(itemID){
    document.body.setAttribute("data-itemID",itemID);
}
// Internal inews id
function getItemID(){
    return document.body.getAttribute("data-itemID");
}

function showSaveButton(){document.getElementById("save").style.display = 'block'; hideDragButton();}
function hideSaveButton(){document.getElementById("save").style.display = 'none';}
function showDragButton(){document.getElementById("drag").style.display = 'block'; hideSaveButton();}
function hideDragButton(){document.getElementById("drag").style.display = 'none';}
function hideBackButton(){document.getElementById("navigateBack").style.display = 'none';}


const originUrl = window.location.origin;
document.getElementById("drag").style.display = 'none';
document.getElementById("save").addEventListener('click', clickOnSave);

document.getElementById('drag').addEventListener('dragstart', drag);
document.getElementById('drag').addEventListener('dragend', drop);
document.getElementById('drag').addEventListener('click', ()=>{
    navigator.clipboard.writeText(createMosMessage());
    hideDragButton();
});
document.querySelector("#navigateBack").addEventListener('click', ()=>{
    window.parent.hideIframe();
});

// ========================================= Preview server ========================================= \\
document.getElementById('preview').addEventListener('click', async ()=>{
    const previewHost = document.getElementById("preview").getAttribute("data-preview-host");
    const previewPort = document.getElementById("preview").getAttribute("data-preview-port");
    await fetch(`http://${previewHost}:${previewPort}?reset`,{method:'GET'});
});


// ========================================= DEBOUNCER ========================================= \\
const debounce = (func, wait) => {
    let timeout;
  
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
  
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
};

// Create debounced functions outside of the event listeners
const debouncedInput = debounce(async function(text) {
    console.log(text);
    const scripts = __NA_GetScripts();
    const templateId = document.body.getAttribute('data-template');
    const previewHost = document.getElementById("preview").getAttribute("data-preview-host");
    const previewPort = document.getElementById("preview").getAttribute("data-preview-port");
    // Send templateId and scripts to preview server
    await fetch(`http://${previewHost}:${previewPort}?${templateId},${scripts}`,{method:'GET'});
}, 500);

document.body.addEventListener('input', function(event) {
    const target = event.target;
    // Check if the event target is an input or textarea
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Call the debounced function
        debouncedInput(`Input changed: ${target.value}`);
    }
});

document.body.addEventListener('change', function(event) {
    const target = event.target;
    // Check if the event target is a select element, a checkbox, or a radio button
    if (target.tagName === 'SELECT' || (target.tagName === 'INPUT' && (target.type === 'checkbox' || target.type === 'radio'))) {
        // Call the debounced function
        debouncedInput(`Input changed: ${target.value}`);
    }
});


// ========================================= Item name based on input (old) ========================================= \\

const slugName = () => {
    // Find the first input element of type "text"
    const firstTextInput = document.querySelector('.toolbox-content input[type="text"]');
    const staticHeader = document.body.getAttribute('data-template-name');
    if (firstTextInput) {
        return staticHeader + firstTextInput.value;
    } else {
        return "No text input found.";
    }
}

function nameInputUpdate(name = undefined){
    if(name === undefined){
        document.getElementById("nameInput").value = slugName();
    }else{
        document.getElementById("nameInput").value = name;
    }   
}

function handleKeyUp(event){
    if (event.target.id === 'nameInput') {return;}
    nameInputUpdate();
}
window.addEventListener('keyup', handleKeyUp);


// ========================================= Communication with child (template) js ========================================= \\

document.addEventListener('messageFromItem', function(e) {
    console.log("Received:", e.detail.name);
});

const focusInput = () => {
    // Find the first input element of type "text"
    const firstTextInput = document.querySelector('.toolbox-content input[type="text"]');
    console.log('Before focus', firstTextInput);
    firstTextInput.focus();
    console.log('After focus', firstTextInput);
}

document.addEventListener('DOMContentLoaded', (event) => {
    focusInput();
});
// In template usage example:
// function updateName() { 
//     var stripeText1 = document.getElementById('stripeText1').value;
//     var event = new CustomEvent('UpdateNameEvent', { detail: { name: stripeText1 } });
//     document.dispatchEvent(event);
// }