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
            name: slugName(),
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
                <itemSlug>${slugName()}</itemSlug>
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

const slugName = () => {
    // Find the first input element of type "text"
    const firstTextInput = document.querySelector('input[type="text"]');

    if (firstTextInput) {
        return firstTextInput.value;
    } else {
        return "No text input found.";
    }
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
function hideMakeCopyButton(){document.getElementById("makeCopy").style.display = 'none';}
function showMakeCopyButton(){document.getElementById("makeCopy").style.display = 'block';}

const originUrl = window.location.origin;
document.getElementById("drag").style.display = 'none';
document.getElementById("save").addEventListener('click', clickOnSave);
document.getElementById("makeCopy").addEventListener('click', clickOnSave);

document.getElementById('drag').addEventListener('dragstart', drag);
document.getElementById('drag').addEventListener('dragend', drop);
document.getElementById('drag').addEventListener('click', ()=>{
    navigator.clipboard.writeText(createMosMessage());
    hideDragButton();
});
document.querySelector("#navigateBack").addEventListener('click', ()=>{
    window.parent.hideIframe();
});

// Preview server interaction
document.getElementById('preview').addEventListener('click', async ()=>{
    const scripts = __NA_GetScripts();
    const productionId = document.body.getAttribute('data-production');
    const previewHost = document.getElementById("preview").getAttribute("data-preview-host");
    const previewPort = document.getElementById("preview").getAttribute("data-preview-port");
    // Send prodId and scripts to preview server
    await fetch(`http://${previewHost}:${previewPort}?#${productionId},${scripts}`,{method:'GET'});
});

function makeCopy(){

}