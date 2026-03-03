let db;
const request = indexedDB.open("AssetDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("assets", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (e) => {
    db = e.target.result;
    renderAssets();
};

function addAsset() {
    const asset = {
        name: document.getElementById('assetName').value,
        serial: document.getElementById('serialNum').value,
        location: document.getElementById('location').value,
        status: document.getElementById('status').value,
        dateAdded: new Date().toLocaleDateString()
    };

    const transaction = db.transaction(["assets"], "readwrite");
    transaction.objectStore("assets").add(asset);
    transaction.oncomplete = () => {
        clearInputs();
        renderAssets();
    };
}

function renderAssets() {
    const tbody = document.getElementById('assetBody');
    tbody.innerHTML = "";
    
    db.transaction("assets").objectStore("assets").getAll().onsuccess = (e) => {
        e.target.result.forEach(asset => {
            const row = `<tr>
                <td>${asset.name}</td>
                <td>${asset.serial}</td>
                <td>${asset.location}</td>
                <td class="status-${asset.status}">${asset.status}</td>
                <td><button onclick="deleteAsset(${asset.id})" style="color:red; cursor:pointer; border:none; background:none;">Delete</button></td>
            </tr>`;
            tbody.innerHTML += row;
        });
    };
}

function deleteAsset(id) {
    const transaction = db.transaction(["assets"], "readwrite");
    transaction.objectStore("assets").delete(id);
    transaction.oncomplete = () => renderAssets();
}

function clearInputs() {
    document.getElementById('assetName').value = "";
    document.getElementById('serialNum').value = "";
    document.getElementById('location').value = "";
}

// Export function to get your data out as a CSV file (Excel compatible)
document.getElementById('exportBtn').onclick = () => {
    db.transaction("assets").objectStore("assets").getAll().onsuccess = (e) => {
        const data = e.target.result;
        let csv = "Name,Serial,Location,Status\n";
        data.forEach(a => {
            csv += `${a.name},${a.serial},${a.location},${a.status}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'assets_inventory.csv';
        a.click();
    };
};