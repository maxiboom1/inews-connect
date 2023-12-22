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

    // Generate and append the table
    const table = document.createElement('table');
    table.id = "templatesTable";

    const headerRow = document.createElement('tr');
    table.appendChild(headerRow);

    // Iterate through templates and create rows
    templates.forEach(function (template) {
        const row = document.createElement('tr');
        const iconCell = document.createElement('td');

        // Check if an icon is available
        if (template.icon) {
            // If an icon exists, create an image element and set its source
            const iconImage = document.createElement('img');
            iconImage.src = 'data:image/png;base64,' + template.icon;
            iconCell.appendChild(iconImage);
        } else {
            // If no icon exists, set the text content with the short text (e.g., name)
            iconCell.textContent = template.name;
        }

        // Append the cell to the row
        row.appendChild(iconCell);

        // Append the row to the table
        table.appendChild(row);
    });

    // Append the table to the templatesContainer
    templatesContainer.appendChild(table);
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

getProductions();
