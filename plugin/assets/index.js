// window.parent.funcName()
// Show/Hide btns logic
async function clickOnSave(){
    try{
        // Those func exists in every gfx template inline
        const _NA_Values = __NA_GetValues();
        const _NA_Scripts = __NA_GetScripts();
        const templateId = document.body.getAttribute('data-template');
        const productionId = document.body.getAttribute('data-production');

        const values = {
            data: _NA_Values,
            scripts: _NA_Scripts,
            templateId: templateId,
            productionId: productionId
        }        
        const gfxItem = await window.parent.fetchData(`${originUrl}/api/set-item`,"POST",JSON.stringify(values));
        setGfxItem(gfxItem);
        showDragButton();

    }catch(err){
        console.error("Failed to post data");
    }
}

function drag(event) {  
    event.dataTransfer.setData("text/plain",createMosMessage());
}

function drop() {
    hideDragButton();
    hideSaveButton();
}

function createMosMessage(){
    const templateId = document.body.getAttribute('data-template');
    const productionId = document.body.getAttribute('data-production');
    const gfxItem = document.body.getAttribute('data-gfxItem');
    
    return `<mos>
        <ncsItem>
            <item>
                <itemID></itemID>
                <itemSlug>${slugName()}</itemSlug>
                <objID>12345</objID>
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
function showSaveButton(){document.getElementById("save").style.display = 'block'; hideDragButton();}
function hideSaveButton(){document.getElementById("save").style.display = 'none';}
function showDragButton(){document.getElementById("drag").style.display = 'block'; hideSaveButton();}
function hideDragButton(){document.getElementById("drag").style.display = 'none';}

const originUrl = window.location.origin;
document.getElementById("drag").style.display = 'none';
document.querySelector("#save").addEventListener('click', clickOnSave);
document.getElementById('drag').addEventListener('dragstart', drag);
document.getElementById('drag').addEventListener('dragend', drop);
document.querySelector("#navigateBack").addEventListener('click', ()=>{
    window.parent.hideIframe();
});

