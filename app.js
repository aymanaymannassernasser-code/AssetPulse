let db;
const request = indexedDB.open("MOPCO_Asset_DB", 2);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "tag" });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadAssets();
};

document.getElementById('importCsv').onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const text = event.target.result;
        const lines = text.split("\n");
        
        const transaction = db.transaction(["assets"], "readwrite");
        const store = transaction.objectStore("assets");

        lines.forEach((line, index) => {
            // Skip the first few empty or header lines from your Excel
            if (index < 3) return; 

            // Handle CSV commas inside quotes
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            
            if (cols && cols[1]) {
                const tag = cols[1].replace(/"/g, "").trim();
                if (tag === "" || tag === "TAG No.") return;

                const asset = {
                    tag: tag,
                    area: (cols[2] || "").replace(/"/g, ""),
                    kw: (cols[9] || "0").replace(/"/g, ""),
                    rpm: (cols[11] || "").replace(/"/g, ""),
                    bearingDE: (cols[14] || "").replace(/"/g, ""),
                    status: (cols[60] || "").includes("Can be taken") ? "Maintenance" : "Operational"
                };
                store.put(asset);
            }
        });

        transaction.oncomplete = () => {
            alert("MOPCO Data Sync Complete!");
            loadAssets();
        };
    };
    reader.readAsText(file);
};

function loadAssets() {
    const tableBody = document.getElementById('assetTableBody');
    tableBody.innerHTML = "";
    let counts = { total: 0, op: 0, maint: 0 };

    const store = db.transaction("assets", "readonly").objectStore("assets");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const a = cursor.value;
            counts.total++;
            a.status === "Operational" ? counts.op++ : counts.maint++;

            const row = `
                <tr>
                    <td><strong>${a.tag}</strong></td>
                    <td>${a.area}</td>
                    <td>${a.kw} KW</td>
                    <td>${a.bearingDE}</td>
                    <td class="status-${a.status}">${a.status}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
            cursor.continue();
        } else {
            document.getElementById('totalCount').innerText = counts.total;
            document.getElementById('opCount').innerText = counts.op;
            document.getElementById('maintCount').innerText = counts.maint;
        }
    };
}

function filterAssets() {
    const q = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.querySelectorAll('#assetTableBody tr');
    rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none");
}