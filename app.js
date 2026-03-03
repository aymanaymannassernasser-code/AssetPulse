// --- v1.2 MOPCO COLUMN MAPPING ---
document.getElementById('importCsv').onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const text = event.target.result;
        const rows = text.split("\n").slice(2); // Skipping the 2 header rows in your file
        
        const transaction = db.transaction(["assets"], "readwrite");
        const store = transaction.objectStore("assets");

        rows.forEach(row => {
            // Using a regex to handle commas inside quotes in your CSV
            const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            
            if (cols && cols.length > 10) {
                const asset = {
                    tag: cols[1]?.replace(/"/g, ""),         // TAG No.
                    area: cols[2]?.replace(/"/g, ""),        // Process AREA
                    desc: cols[3]?.replace(/"/g, ""),        // DESCRIPTION
                    kw: cols[9]?.replace(/"/g, ""),          // KW
                    rpm: cols[11]?.replace(/"/g, ""),        // RPM
                    bearingDE: cols[14]?.replace(/"/g, ""),  // DE BEARING TYPE
                    status: cols[60]?.includes("Can be taken") ? "Maintenance" : "Operational", // Operation Status
                    lastGrease: cols[35]?.replace(/"/g, ""), // Date at Last Greasing
                    notes: cols[59]?.replace(/"/g, "")       // COMMENTS (Arabic)
                };
                store.put(asset); // 'put' updates if TAG already exists
            }
        });

        transaction.oncomplete = () => {
            alert("MOPCO Master Data Imported Successfully!");
            loadAssets();
        };
    };
    reader.readAsText(file);
};

function loadAssets() {
    const tableBody = document.getElementById('assetTableBody');
    tableBody.innerHTML = "";
    let counts = { total: 0, op: 0, maint: 0 };

    db.transaction("assets", "readonly").objectStore("assets").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const a = cursor.value;
            counts.total++;
            if (a.status === "Operational") counts.op++; else counts.maint++;

            const row = `
                <tr onclick="viewDetails('${a.tag}')">
                    <td><strong>${a.tag}</strong></td>
                    <td>${a.area}</td>
                    <td>${a.kw} KW</td>
                    <td>${a.rpm}</td>
                    <td>${a.bearingDE}</td>
                    <td class="status-${a.status}">${a.status}</td>
                    <td>${a.lastGrease || 'N/A'}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
            cursor.continue();
        } else {
            updateStats(counts);
        }
    };
}

function updateStats(c) {
    document.getElementById('totalCount').innerText = c.total;
    document.getElementById('opCount').innerText = c.op;
    document.getElementById('maintCount').innerText = c.maint;
}