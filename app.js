// --- DATABASE INITIALIZATION (v1.0) ---
let db;
const request = indexedDB.open("AssetTrackerDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadAssets();
};

// --- CORE FUNCTIONS ---
function addAsset() {
    const name = document.getElementById('assetName').value;
    const serial = document.getElementById('serialNum').value;
    const loc = document.getElementById('location').value;
    const stat = document.getElementById('status').value;

    if (!name) return alert("Please enter an asset name");

    const asset = { name, serial, location: loc, status: stat, timestamp: new Date() };
    const transaction = db.transaction(["assets"], "readwrite");
    const store = transaction.objectStore("assets");
    
    store.add(asset);
    transaction.oncomplete = () => {
        document.getElementById('assetName').value = "";
        document.getElementById('serialNum').value = "";
        loadAssets();
    };
}

function loadAssets() {
    const tableBody = document.getElementById('assetTableBody');
    tableBody.innerHTML = "";

    const store = db.transaction("assets", "readonly").objectStore("assets");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const asset = cursor.value;
            const row = `
                <tr>
                    <td><strong>${asset.name}</strong></td>
                    <td>${asset.serial || 'N/A'}</td>
                    <td>${asset.location || 'Unknown'}</td>
                    <td class="status-${asset.status}">${asset.status}</td>
                    <td>
                        <button onclick="deleteAsset(${asset.id})" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
            cursor.continue();
        }
    };
}

function deleteAsset(id) {
    if (confirm("Delete this asset?")) {
        const transaction = db.transaction(["assets"], "readwrite");
        transaction.objectStore("assets").delete(id);
        transaction.oncomplete = () => loadAssets();
    }
}

// --- UTILITIES ---
function filterAssets() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.querySelectorAll('#assetTableBody tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
    });
}

// Export data to CSV so you can open it in Excel
document.getElementById('exportCsv').onclick = () => {
    const store = db.transaction("assets", "readonly").objectStore("assets");
    store.getAll().onsuccess = (e) => {
        const allAssets = e.target.result;
        let csvContent = "data:text/csv;charset=utf-8,Name,Serial,Location,Status\n";
        
        allAssets.forEach(a => {
            csvContent += `${a.name},${a.serial},${a.location},${a.status}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "factory_assets.csv");
        document.body.appendChild(link);
        link.click();
    };
};