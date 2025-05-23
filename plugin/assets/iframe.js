const originUrl = window.location.origin;
document.getElementById("save").addEventListener('click', clickOnSave);
function hideSaveButton(){
    document.getElementById("save").style.display = 'none';
}
document.querySelector("#navigateBack").addEventListener('click', ()=>{
    window.parent.hideIframe();
});

async function clickOnSave(){
    try{
        const values = getItemData(); // returns item{name,data,scripts,templateId,productionId}       
        const gfxItem = await window.parent.fetchData(`${originUrl}/api/set-item`,"POST",JSON.stringify(values));
        setGfxItem(gfxItem);
        await setCopyBuffer(gfxItem);
        const promptSpan = document.getElementById('promptSpan');
        promptSpan.style.display = "block";
        promptSpan.style.color = "green";
        promptSpan.textContent = "Item saved"

        setTimeout(() => {
            promptSpan.style.display = "none";
        }, 3000);

    }catch(err){
        console.error("Failed to post data");
    }
}

async function setCopyBuffer(gfxItem){
    // Try copying with Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(createMosMessage(gfxItem));
    } else {
        // Fallback method
        const tempTextarea = document.createElement("textarea");
        tempTextarea.value = createMosMessage(gfxItem);
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextarea);
        console.warn("Clipboard API not available; used fallback method.");
    }
}

function createMosMessage(gfxItem){
    const templateId = document.body.getAttribute('data-template');
    const productionId = document.body.getAttribute('data-production');
    const item = getItemData();//item{name,data,scripts,templateId,productionId}

    const slug = document.getElementById("nameInput").value.replace(/'/g, "").replace(/&/g, '');
 
    const mosEscape = (str) => {
        return str
            .replace(/&/g, '__AMP__')
            .replace(/'/g, '__APOSTROPHE__')
    }; 

    return `<mos>
        <ncsItem>
            <item>
                <itemID></itemID>
                <itemSlug>${slug}</itemSlug> 
                <objID></objID>
                <mosID>iNEWSMOS1</mosID>
                <mosItemBrowserProgID>alex</mosItemBrowserProgID>
                <mosItemEditorProgID>alexE</mosItemEditorProgID>
                <mosAbstract></mosAbstract>
                <group>1</group>
                <gfxItem>${gfxItem}</gfxItem>
                <gfxTemplate>${templateId}</gfxTemplate>
                <gfxProduction>${productionId}</gfxProduction>
                <gfxData>${mosEscape(item.data)}</gfxData>
                <gfxScripts>${mosEscape(item.scripts)}</gfxScripts>
            </item>
        </ncsItem>
    </mos>`; 
}

function getItemData(){
        const _NA_Values = __NA_GetValues();
        let _NA_Scripts = __NA_GetScripts();
        const templateId = document.body.getAttribute('data-template');
        const productionId = document.body.getAttribute('data-production');
        // Fallback for "no scripts" from template
        if(_NA_Scripts === undefined){ _NA_Scripts = "No scripts provided";}
        
        return values = {
            name:document.getElementById("nameInput").value,
            data: _NA_Values,
            scripts: _NA_Scripts,
            templateId: templateId,
            productionId: productionId
        }        
}

function setDuplicateStatus(bool,itemData){
    document.body.setAttribute("data-hasDuplicate",bool);
    if(getDuplicateStatus() === "true"){
        const promptSpan = document.getElementById('promptSpan');
        promptSpan.textContent = "Copied";
        promptSpan.style.color = "red";
        promptSpan.style.display = "block";
        document.getElementById("tooltip").innerHTML = `${itemData.rundown}<br>${itemData.story}`;
    }
}

function getDuplicateStatus(){
    return document.body.getAttribute("data-hasDuplicate");
}

function setGfxItem(gfxItem){
    document.body.setAttribute("data-gfxItem",gfxItem);
}

function getGfxItem(){
    return document.body.getAttribute("data-gfxItem");
}

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
    console.log("x")
    const target = event.target;
    // Check if the event target is a select element, a checkbox, or a radio button
    if (target.tagName === 'SELECT' || (target.tagName === 'INPUT' && (target.type === 'checkbox' || target.type === 'radio'))) {
        // Call the debounced function
        debouncedInput(`Input changed: ${target.value}`);
    }
});

// ======================== Item name based on input (triggered from template func updateName()), or from renderItem onload ================== \\

// Onload, we showing the name that we receive from renderItem, 
//and its return name with template name, so we use includedTemplateName bool to handle this case
function nameInputUpdate(name, includedTemplateName = false){ 
    if(includedTemplateName){
        document.getElementById("nameInput").value = name;
        if(document.getElementById("nameInput").value === ""){
            const staticHeader = document.body.getAttribute('data-template-name');
        }
        return;
    }
    const staticHeader = document.body.getAttribute('data-template-name');
    let result = staticHeader + name;
    
    if(result.length>40){
        result = result.substring(0,40);
    }

    document.getElementById("nameInput").value = result;    
}

function setNameOnLoad(){
    const staticHeader = document.body.getAttribute('data-template-name');
    document.getElementById("nameInput").value = staticHeader;   
}

document.addEventListener('UpdateNameEvent', function(event) {nameInputUpdate(event.detail.name);}); 

// ======================== Favorites && Duplicates status tooltip ========================
document.addEventListener('DOMContentLoaded', () => {
    const linkButton = document.getElementById('linkButton');
    const popover = document.getElementById('pluginPopover');
    
    linkButton.addEventListener('mouseover', (e) => {
        const rect = linkButton.getBoundingClientRect();
        popover.style.top = `${rect.bottom + window.scrollY}px`;
        popover.style.left = `${rect.left + window.scrollX}px`;
        popover.style.display = 'block';
      });
    
    linkButton.addEventListener('mouseout', () => {
    popover.style.display = 'none';
    });

    popover.addEventListener('mouseover', () => {
    popover.style.display = 'block';
    });

    popover.addEventListener('mouseout', () => {
    popover.style.display = 'none';
    });

    var favoritesButtons = document.querySelectorAll(".linksButton");
    const buttonData = {};
    favoritesButtons.forEach(button => {
        const id = button.id;
        const key = button.getAttribute("data-key");
        buttonData[key] = id;
        button.addEventListener('click', handleLinksButtonsClick, false);
    });

    // Handle key handler to change to favorite
    document.addEventListener("keydown", async (event)  => {
        const modifier = document.getElementById("pluginPopover").getAttribute("data-modifier"); // Return string "alt"/"ctrl"/"shift"
        const keyPressed = event.key.toLowerCase();
        
        // Check if the appropriate modifier key is pressed
        const isModifierPressed = 
            (modifier === 'ctrl' && event.ctrlKey) ||
            (modifier === 'alt' && event.altKey) ||
            (modifier === 'shift' && event.shiftKey);
        
            if (buttonData[keyPressed]&& isModifierPressed) {
                window.parent.renderTemplate(buttonData[keyPressed]);
            }

            if ((keyPressed === "s" || keyPressed === "ד") && event.ctrlKey) {
                await clickOnSave();
            }
    
    });

    const promptSpan = document.getElementById('promptSpan');
    const tooltip = document.getElementById('tooltip');
    
    // Tooltip showing logic
    if (promptSpan && tooltip) {
        promptSpan.addEventListener('mouseenter', () => {
            const rect = promptSpan.getBoundingClientRect();
            tooltip.style.top = rect.bottom + window.scrollY + 5 + 'px';  // Position tooltip below the span
            tooltip.style.left = rect.left + window.scrollX + 'px';      // Align with the left of the span
            tooltip.style.display = 'block';  // Show the tooltip
        });

        // Tooltip hiding logic
        promptSpan.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';  // Hide the tooltip
        });
    }

})

function handleLinksButtonsClick(){
    window.parent.renderTemplate(this.id);
}

