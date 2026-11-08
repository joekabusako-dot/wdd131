"use strict";

/* =========================================
   KIJ CARRELAGE PRO
   Moteur principal de l'application
========================================= */

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "kijCarrelagePro_projects_v1";

const state = {
    rooms: [],
    floor: null,
    floorMortar: null,
    perimeter: null,
    skirting: null,
    wall: null
};

const moneyFormat = (value, currency = "USD") =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

const numberFormat = (value, decimals = 2) =>
    new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    }).format(Number(value) || 0);

const safe = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

function notify(message) {
    const notification = $("notification");
    if (!notification) return;

    notification.textContent = message;
    notification.classList.add("show");

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

function getValue(id) {
    return $(id)?.value?.trim() ?? "";
}

function getNumber(id) {
    const value = Number(getValue(id));
    return Number.isFinite(value) ? value : 0;
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function getProjectInfo() {
    return {
        nomProjet: getValue("nomProjet") || "Projet sans nom",
        nomClient: getValue("nomClient"),
        nomPrestataire: getValue("nomPrestataire"),
        adresseProjet: getValue("adresseProjet"),
        devise: getValue("devise") || "USD",
        epaisseurMortierSol: getNumber("epaisseurMortierSol"),
        hauteurplinthe: getNumber("hauteurplinthe"),
        longueurpiece: getNumber("longueurpiece"),
        largeurpiece: getNumber("largeurpiece"),
        epaisseurpose: getNumber("epaisseurpose")
    };
}

/* =========================================
   1. GESTION DES PIÈCES
========================================= */

function roomField(label, key, placeholder, unit = "m") {
    return `
        <div class="field">
            <label>${label} (${unit})</label>
            <input
                type="number"
                min="0"
                step="0.01"
                data-dim="${key}"
                placeholder="${placeholder}"
                required
            >
        </div>
    `;
}

function roomFields(shape) {
    switch (shape) {
        case "rectangle":
            return `
                ${roomField("Longueur", "longueur", "Ex. 5")}
                ${roomField("Largeur", "largeur", "Ex. 4")}
            `;

        case "cercle":
            return roomField("Rayon", "rayon", "Ex. 2");

        case "trapeze":
            return `
                ${roomField("Grande base", "base1", "Ex. 5")}
                ${roomField("Petite base", "base2", "Ex. 3")}
                ${roomField("Hauteur", "hauteur", "Ex. 2.5")}
                ${roomField("Côté gauche", "cote1", "Ex. 2.7")}
                ${roomField("Côté droit", "cote2", "Ex. 2.7")}
            `;

        case "parallelogramme":
            return `
                ${roomField("Base", "base", "Ex. 5")}
                ${roomField("Hauteur", "hauteur", "Ex. 3")}
                ${roomField("Côté", "cote", "Ex. 4")}
            `;

        default:
            return "";
    }
}

function roomTemplate(index, room = {}) {
    const shape = room.shape || "rectangle";

    return `
        <article class="room-card" data-room="${index}">
            <h3>Pièce ${index + 1}</h3>

            <div class="field">
                <label>Nom de la pièce</label>
                <input
                    type="text"
                    data-room-name
                    value="${safe(room.name || `Pièce ${index + 1}`)}"
                    placeholder="Ex. Salon"
                >
            </div>

            <div class="field">
                <label>Forme géométrique</label>
                <select data-shape>
                    <option value="rectangle" ${shape === "rectangle" ? "selected" : ""}>Rectangle</option>
                    <option value="cercle" ${shape === "cercle" ? "selected" : ""}>Cercle</option>
                    <option value="trapeze" ${shape === "trapeze" ? "selected" : ""}>Trapèze</option>
                    <option value="parallelogramme" ${shape === "parallelogramme" ? "selected" : ""}>Parallélogramme</option>
                </select>
            </div>

            <div class="room-fields" data-room-fields>
                ${roomFields(shape)}
            </div>
        </article>
    `;
}

function createRooms(savedRooms = null) {
    const container = $("formulairespieces");
    if (!container) return;

    const count = Math.max(
        1,
        Math.min(100, Number($("nombrepieces")?.value) || 1)
    );

    const rooms = savedRooms || Array.from({ length: count }, (_, index) => ({
        name: `Pièce ${index + 1}`,
        shape: "rectangle",
        dimensions: {}
    }));

    state.rooms = rooms;

    container.innerHTML = rooms.map((room, index) =>
        roomTemplate(index, room)
    ).join("");

    container.querySelectorAll(".room-card").forEach((card, index) => {
        const room = rooms[index];

        card.querySelectorAll("[data-dim]").forEach((input) => {
            const key = input.dataset.dim;
            const value = room.dimensions?.[key];

            if (value !== undefined && value !== null) {
                input.value = value;
            }
        });

        card.querySelector("[data-shape]").addEventListener("change", (event) => {
            const shape = event.target.value;
            const fields = card.querySelector("[data-room-fields]");
            fields.innerHTML = roomFields(shape);
            clearResults();
        });

        card.querySelectorAll("input").forEach((input) => {
            input.addEventListener("input", clearResults);
        });

        card.querySelector("[data-room-name]").addEventListener("input", clearResults);
    });

    clearResults();
}

function collectRooms() {
    return [...$("formulairespieces").querySelectorAll(".room-card")].map((card) => {
        const dimensions = {};

        card.querySelectorAll("[data-dim]").forEach((input) => {
            dimensions[input.dataset.dim] = Number(input.value);
        });

        return {
            name: card.querySelector("[data-room-name]").value.trim(),
            shape: card.querySelector("[data-shape]").value,
            dimensions
        };
    });
}

/* =========================================
   2. CALCULS GÉOMÉTRIQUES
========================================= */

function calculateRoom(room) {
    const d = room.dimensions;
    let area = 0;
    let perimeter = 0;

    if (room.shape === "rectangle") {
        if (d.longueur <= 0 || d.largeur <= 0) return null;

        area = d.longueur * d.largeur;
        perimeter = 2 * (d.longueur + d.largeur);
    }

    if (room.shape === "cercle") {
        if (d.rayon <= 0) return null;

        area = Math.PI * d.rayon ** 2;
        perimeter = 2 * Math.PI * d.rayon;
    }

    if (room.shape === "trapeze") {
        if (
            d.base1 <= 0 || d.base2 <= 0 ||
            d.hauteur <= 0 || d.cote1 <= 0 || d.cote2 <= 0
        ) return null;

        area = ((d.base1 + d.base2) * d.hauteur) / 2;
        perimeter = d.base1 + d.base2 + d.cote1 + d.cote2;
    }

    if (room.shape === "parallelogramme") {
        if (d.base <= 0 || d.hauteur <= 0 || d.cote <= 0) return null;

        area = d.base * d.hauteur;
        perimeter = 2 * (d.base + d.cote);
    }

    if (!Number.isFinite(area) || !Number.isFinite(perimeter)) {
        return null;
    }

    return { area, perimeter };
}

function clearResults() {
    state.floor = null;
    state.floorMortar = null;
    state.perimeter = null;
    state.skirting = null;
    state.wall = null;

    setText("resultatsurface", "Les dimensions ont changé. Relancez le calcul.");
    setText("resultatMortierSol", "Calculez d'abord les surfaces du sol.");
    setText("resultatperimetre", "");
    setText("resultatplinthes", "");
    setText("resultatfaience", "");

    const step = $("etapehauteur");
    if (step) step.hidden = true;

    const table = $("tableauResultats");
    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="4" class="empty-cell">
                    Relancez les calculs pour actualiser le tableau.
                </td>
            </tr>
        `;
    }

    setText("resultStatus", "Calculs à actualiser");
    setText("saveStatus", "Modifications non enregistrées");
}

/* =========================================
   3. CALCUL DU CARRELAGE SOL
========================================= */

function calculateFloor() {
    const rooms = collectRooms();

    if (!rooms.length) {
        notify("Ajoutez au moins une pièce.");
        return;
    }

    const results = rooms.map((room) => ({
        name: room.name || "Pièce sans nom",
        ...calculateRoom(room)
    }));

    if (results.some((room) => !Number.isFinite(room.area))) {
        notify("Vérifiez les dimensions de toutes les pièces.");
        return;
    }

    const totalArea = results.reduce((sum, room) => sum + room.area, 0);
    const totalPerimeter = results.reduce((sum, room) => sum + room.perimeter, 0);
    const lossRate = Number($("tauxpertes").value) || 10;
    const areaWithLoss = totalArea * (1 + lossRate / 100);

    state.rooms = rooms;
    state.floor = {
        rooms: results,
        totalArea,
        totalPerimeter,
        lossRate,
        areaWithLoss
    };

    $("resultatsurface").innerHTML = `
        <strong>Résultat du métré du sol</strong>
        <ul>
            <li>Surface nette : <strong>${numberFormat(totalArea)} m²</strong></li>
            <li>Pertes prévues : <strong>${lossRate} %</strong></li>
            <li>Quantité de carreaux à prévoir : <strong>${numberFormat(areaWithLoss)} m²</strong></li>
        </ul>
    `;

    updateSummary();
    setText("resultStatus", "Calculs actualisés");
    notify("Surface du sol calculée.");
}

/* =========================================
   4. CALCUL DU MORTIER SOL
========================================= */

function calculateFloorMortar() {
    if (!state.floor) {
        notify("Calculez d'abord la surface du sol.");
        return;
    }

    const thickness = getNumber("epaisseurMortierSol");

    if (thickness <= 0) {
        notify("Entrez une épaisseur de mortier valide.");
        return;
    }

    const wetVolume = state.floor.totalArea * (thickness / 100);
    const dryVolume = wetVolume * 1.33 * 1.20;

    const cementVolume = dryVolume / 5;
    const sandVolume = dryVolume * 4 / 5;

    const cementBags = cementVolume / 0.035;
    const sandTonnes = sandVolume * 1.6;

    state.floorMortar = {
        wetVolume,
        dryVolume,
        cementBags,
        sandTonnes
    };

    $("resultatMortierSol").innerHTML = `
        <strong>Estimation du mortier pour le sol</strong>
        <ul>
            <li>Volume de mortier frais : ${numberFormat(wetVolume)} m³</li>
            <li>Volume sec estimé avec marge : ${numberFormat(dryVolume)} m³</li>
            <li>Ciment : <strong>${numberFormat(cementBags, 1)} sacs de 50 kg</strong></li>
            <li>Sable : <strong>${numberFormat(sandTonnes)} tonnes</strong></li>
        </ul>
        <p class="disclaimer">Dosage indicatif 1:4 en volume, avec coefficient de conversion et marge de 20 %.</p>
    `;

    updateSummary();
    notify("Mortier du sol calculé.");
}

/* =========================================
   5. CALCUL DU PÉRIMÈTRE ET DES PLINTHES
========================================= */

function calculatePerimeter() {
    if (!state.floor) {
        notify("Calculez d'abord les surfaces du sol.");
        return;
    }

    const total = state.floor.totalPerimeter;

    state.perimeter = total;

    $("resultatperimetre").innerHTML = `
        Périmètre géométrique total des pièces :
        <strong>${numberFormat(total)} mètres linéaires</strong>.
    `;

    $("etapehauteur").hidden = false;
    notify("Périmètre calculé.");
}

function calculateSkirting() {
    if (state.perimeter === null) {
        notify("Calculez d'abord le périmètre.");
        return;
    }

    const height = getNumber("hauteurplinthe");

    if (height <= 0) {
        notify("Entrez une hauteur de plinthe valide.");
        return;
    }

    const netArea = state.perimeter * height;
    const areaWithLoss = netArea * 1.10;

    state.skirting = {
        perimeter: state.perimeter,
        height,
        netArea,
        areaWithLoss
    };

    $("resultatplinthes").innerHTML = `
        <strong>Résultat des plinthes</strong>
        <ul>
            <li>Longueur : ${numberFormat(state.perimeter)} ml</li>
            <li>Hauteur : ${numberFormat(height)} m</li>
            <li>Surface nette : ${numberFormat(netArea)} m²</li>
            <li>Avec 10 % de pertes : <strong>${numberFormat(areaWithLoss)} m²</strong></li>
        </ul>
    `;

    updateSummary();
    notify("Surface des plinthes calculée.");
}

/* =========================================
   6. FAÏENCE ET MORTIER MURAL
========================================= */

function calculateWall() {
    const length = getNumber("longueurpiece");
    const height = getNumber("largeurpiece");
    const thickness = getNumber("epaisseurpose");

    if (length <= 0 || height <= 0 || thickness <= 0) {
        notify("Vérifiez la longueur, la hauteur et l'épaisseur.");
        return;
    }

    const netArea = length * height;
    const areaWithLoss = netArea * 1.10;

    const wetVolume = netArea * (thickness / 100);
    const dryVolume = wetVolume * 1.33 * 1.20;

    const cementVolume = dryVolume / 5;
    const sandVolume = dryVolume * 4 / 5;

    const cementBags = cementVolume / 0.035;
    const sandTonnes = sandVolume * 1.6;

    state.wall = {
        length,
        height,
        thickness,
        netArea,
        areaWithLoss,
        wetVolume,
        dryVolume,
        cementBags,
        sandTonnes
    };

    $("resultatfaience").innerHTML = `
        <strong>Résultat du revêtement mural</strong>
        <ul>
            <li>Surface nette : ${numberFormat(netArea)} m²</li>
            <li>Faïence avec 10 % de pertes : <strong>${numberFormat(areaWithLoss)} m²</strong></li>
            <li>Volume de mortier frais : ${numberFormat(wetVolume)} m³</li>
            <li>Ciment : <strong>${numberFormat(cementBags, 1)} sacs de 50 kg</strong></li>
            <li>Sable : <strong>${numberFormat(sandTonnes)} tonnes</strong></li>
        </ul>
        <p class="disclaimer">Estimation indicative. Les ouvertures (portes, fenêtres) ne sont pas déduites.</p>
    `;

    updateSummary();
    notify("Faïence et mortier mural calculés.");
}

/* =========================================
   7. TABLEAU RÉCAPITULATIF
========================================= */

function updateSummary() {
    const rows = [];

    if (state.floor) {
        state.floor.rooms.forEach((room) => {
            rows.push([
                "Sol",
                room.name,
                numberFormat(room.area),
                "m²"
            ]);
        });

        rows.push([
            "Sol",
            "Carreaux avec pertes",
            numberFormat(state.floor.areaWithLoss),
            "m²"
        ]);
    }

    if (state.floorMortar) {
        rows.push([
            "Mortier sol",
            "Ciment",
            numberFormat(state.floorMortar.cementBags, 1),
            "sacs de 50 kg"
        ]);

        rows.push([
            "Mortier sol",
            "Sable",
            numberFormat(state.floorMortar.sandTonnes),
            "tonnes"
        ]);
    }

    if (state.skirting) {
        rows.push([
            "Plinthes",
            "Surface avec pertes",
            numberFormat(state.skirting.areaWithLoss),
            "m²"
        ]);
    }

    if (state.wall) {
        rows.push([
            "Faïence",
            "Surface avec pertes",
            numberFormat(state.wall.areaWithLoss),
            "m²"
        ]);

        rows.push([
            "Mortier mural",
            "Ciment",
            numberFormat(state.wall.cementBags, 1),
            "sacs de 50 kg"
        ]);

        rows.push([
            "Mortier mural",
            "Sable",
            numberFormat(state.wall.sandTonnes),
            "tonnes"
        ]);
    }

    const tbody = $("tableauResultats");

    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `
            <tr><td colspan="4" class="empty-cell">Aucun calcul effectué.</td></tr>
        `;
        return;
    }

    tbody.innerHTML = rows.map((row) => `
        <tr>
            <td>${safe(row[0])}</td>
            <td>${safe(row[1])}</td>
            <td><strong>${safe(row[2])}</strong></td>
            <td>${safe(row[3])}</td>
        </tr>
    `).join("");
}

/* =========================================
   8. PRÉPARATION DU DEVIS
========================================= */

function price(id) {
    const value = getNumber(id);
    return value >= 0 ? value : 0;
}

function createQuoteLines() {
    const lines = [];

    if (state.floor) {
        lines.push({
            description: "Carrelage du sol avec pertes",
            quantity: state.floor.areaWithLoss,
            unit: "m²",
            price: price("prixCarreaux")
        });
    }

    if (state.skirting) {
        lines.push({
            description: "Plinthes avec pertes",
            quantity: state.skirting.areaWithLoss,
            unit: "m²",
            price: price("prixPlinthes")
        });
    }

    if (state.wall) {
        lines.push({
            description: "Faïence murale avec pertes",
            quantity: state.wall.areaWithLoss,
            unit: "m²",
            price: price("prixFaience")
        });
    }

    if (state.floorMortar) {
        lines.push({
            description: "Ciment pour mortier de sol",
            quantity: state.floorMortar.cementBags,
            unit: "sacs",
            price: price("prixCiment")
        });

        lines.push({
            description: "Sable pour mortier de sol",
            quantity: state.floorMortar.sandTonnes,
            unit: "tonnes",
            price: price("prixSable")
        });
    }

    if (state.wall) {
        lines.push({
            description: "Ciment pour mortier mural",
            quantity: state.wall.cementBags,
            unit: "sacs",
            price: price("prixCiment")
        });

        lines.push({
            description: "Sable pour mortier mural",
            quantity: state.wall.sandTonnes,
            unit: "tonnes",
            price: price("prixSable")
        });
    }

    const laborArea =
        (state.floor?.totalArea || 0) +
        (state.skirting?.netArea || 0) +
        (state.wall?.netArea || 0);

    if (laborArea > 0) {
        lines.push({
            description: "Main-d'œuvre",
            quantity: laborArea,
            unit: "m²",
            price: price("prixMainOeuvre")
        });
    }

    return lines;
}

function generateQuote() {
    const lines = createQuoteLines();

    if (!lines.length) {
        notify("Effectuez au moins un calcul avant de préparer le devis.");
        return;
    }

    const info = getProjectInfo();
    const currency = info.devise;

    const total = lines.reduce(
        (sum, line) => sum + line.quantity * line.price,
        0
    );

    const date = new Date().toLocaleDateString("fr-FR");

    const quoteRows = lines.map((line) => `
        <tr>
            <td>${safe(line.description)}</td>
            <td>${numberFormat(line.quantity, 2)}</td>
            <td>${safe(line.unit)}</td>
            <td>${moneyFormat(line.price, currency)}</td>
            <td>${moneyFormat(line.quantity * line.price, currency)}</td>
        </tr>
    `).join("");

    $("zoneDevis").innerHTML = `
        <div class="quote-header">
            <h2>KIJ CARRELAGE PRO</h2>
            <p>MÉTRÉ ET ESTIMATION DES TRAVAUX DE CARRELAGE</p>
            <hr>
        </div>

        <h3>DEVIS ESTIMATIF</h3>

        <p><strong>Projet :</strong> ${safe(info.nomProjet)}</p>
        <p><strong>Client :</strong> ${safe(info.nomClient || "Non renseigné")}</p>
        <p><strong>Prestataire :</strong> ${safe(info.nomPrestataire || "Non renseigné")}</p>
        <p><strong>Chantier :</strong> ${safe(info.adresseProjet || "Non renseigné")}</p>
        <p><strong>Date :</strong> ${date}</p>

        <table>
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>${quoteRows}</tbody>
        </table>

        <p class="quote-total">
            TOTAL ESTIMATIF : ${moneyFormat(total, currency)}
        </p>

        <p class="disclaimer">
            Ce document est un devis estimatif établi sur la base des quantités
            calculées et des prix saisis. Il doit être vérifié et validé avant
            engagement contractuel.
        </p>

        <div class="quote-signatures">
            <div>
                <strong>Le prestataire</strong>
                <p>Nom et signature :</p>
            </div>
            <div>
                <strong>Le client</strong>
                <p>Nom et signature :</p>
            </div>
        </div>
    `;

    notify("Devis préparé.");
}

/* =========================================
   9. IMPRESSION / EXPORT PDF
========================================= */

function printQuote() {
    const quote = $("zoneDevis");

    if (!quote || !quote.querySelector("table")) {
        notify("Préparez d'abord le devis.");
        return;
    }

    window.print();
}

/* =========================================
   10. SAUVEGARDE LOCALE
========================================= */

function readProjects() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Erreur de lecture des projets :", error);
        return [];
    }
}

function writeProjects(projects) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return true;
    } catch (error) {
        console.error("Erreur de sauvegarde :", error);
        notify("Impossible de sauvegarder. Espace de stockage insuffisant ?");
        return false;
    }
}

function createProjectId() {
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `kij-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function collectProject() {
    const inputs = {};

    document.querySelectorAll(
        "#nomProjet, #nomClient, #nomPrestataire, #adresseProjet, #devise, " +
        "#tauxpertes, #epaisseurMortierSol, #hauteurplinthe, " +
        "#longueurpiece, #largeurpiece, #epaisseurpose, " +
        "#prixCarreaux, #prixPlinthes, #prixFaience, #prixCiment, " +
        "#prixSable, #prixMainOeuvre"
    ).forEach((input) => {
        inputs[input.id] = input.value;
    });

    return {
        id: createProjectId(),
        date: new Date().toISOString(),
        project: inputs,
        rooms: collectRooms()
    };
}

function saveProject() {
    const project = collectProject();
    const projects = readProjects();

    const existingIndex = projects.findIndex((item) =>
        item.project?.nomProjet === project.project.nomProjet &&
        item.project?.nomClient === project.project.nomClient
    );

    if (existingIndex >= 0) {
        project.id = projects[existingIndex].id;
        projects[existingIndex] = project;
    } else {
        projects.unshift(project);
    }

    if (!writeProjects(projects)) return;

    renderProjects();
    setText("saveStatus", "Projet enregistré");
    notify("Projet enregistré sur cet appareil.");
}

function renderProjects() {
    const tbody = $("listeProjets");
    if (!tbody) return;

    const projects = readProjects();

    if (!projects.length) {
        tbody.innerHTML = `
            <tr><td colspan="4" class="empty-cell">Aucun projet enregistré.</td></tr>
        `;
        return;
    }

    tbody.innerHTML = projects.map((project) => `
        <tr>
            <td>${safe(project.project?.nomProjet || "Projet sans nom")}</td>
            <td>${safe(project.project?.nomClient || "—")}</td>
            <td>${new Date(project.date).toLocaleString("fr-FR")}</td>
            <td>
                <button class="button button-small button-secondary"
                    data-load="${safe(project.id)}" type="button">
                    Ouvrir
                </button>
                <button class="button button-small button-danger"
                    data-delete="${safe(project.id)}" type="button">
                    Supprimer
                </button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-load]").forEach((button) => {
        button.addEventListener("click", () => loadProject(button.dataset.load));
    });

    tbody.querySelectorAll("[data-delete]").forEach((button) => {
        button.addEventListener("click", () => deleteProject(button.dataset.delete));
    });
}

function loadProject(id) {
    const project = readProjects().find((item) => item.id === id);

    if (!project) {
        notify("Projet introuvable.");
        return;
    }

    Object.entries(project.project || {}).forEach(([key, value]) => {
        const input = $(key);
        if (input) input.value = value;
    });

    $("nombrepieces").value = Math.max(1, project.rooms?.length || 1);

    createRooms(project.rooms || []);

    calculateFloor();

    if (state.floor && getNumber("epaisseurMortierSol") > 0) {
        calculateFloorMortar();
    }

    if (state.floor && getNumber("hauteurplinthe") > 0) {
        calculatePerimeter();
        calculateSkirting();
    }

    if (
        getNumber("longueurpiece") > 0 &&
        getNumber("largeurpiece") > 0
    ) {
        calculateWall();
    }

    setText("saveStatus", "Projet chargé");
    notify("Projet chargé.");
}

function deleteProject(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce projet ?")) return;

    const projects = readProjects().filter((project) => project.id !== id);

    if (!writeProjects(projects)) return;

    renderProjects();
    notify("Projet supprimé.");
}

/* =========================================
   11. EXPORT ET IMPORT JSON
========================================= */

function exportProjects() {
    const projects = readProjects();

    if (!projects.length) {
        notify("Aucun projet à exporter.");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(projects, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `KIJ-Carrelage-Pro-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    notify("Sauvegarde exportée.");
}

function importProjects(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);

            if (!Array.isArray(imported)) {
                throw new Error("Format invalide");
            }

            const existing = readProjects();

            imported.forEach((project) => {
                if (
                    project &&
                    project.id &&
                    project.project &&
                    Array.isArray(project.rooms)
                ) {
                    const index = existing.findIndex((item) => item.id === project.id);

                    if (index >= 0) {
                        existing[index] = project;
                    } else {
                        existing.push(project);
                    }
                }
            });

            if (!writeProjects(existing)) return;

            renderProjects();
            notify("Sauvegarde importée.");
        } catch (error) {
            console.error(error);
            notify("Fichier JSON invalide ou endommagé.");
        }

        event.target.value = "";
    };

    reader.readAsText(file);
}

/* =========================================
   12. NOUVEAU PROJET
========================================= */

function newProject() {
    if (!confirm("Créer un nouveau projet ? Les modifications non enregistrées seront perdues.")) {
        return;
    }

    document.querySelectorAll(
        "#nomProjet, #nomClient, #nomPrestataire, #adresseProjet, " +
        "#prixCarreaux, #prixPlinthes, #prixFaience, #prixCiment, " +
        "#prixSable, #prixMainOeuvre, #longueurpiece, #largeurpiece"
    ).forEach((input) => {
        input.value = "";
    });

    $("devise").value = "USD";
    $("nombrepieces").value = "1";
    $("tauxpertes").value = "10";
    $("epaisseurMortierSol").value = "3";
    $("hauteurplinthe").value = "";
    $("epaisseurpose").value = "1.5";

    createRooms();
    setText("saveStatus", "Nouveau projet");
    notify("Nouveau projet créé.");
}

/* =========================================
   13. DATES DU PIED DE PAGE
========================================= */

function updateFooter() {
    setText("currentyear", new Date().getFullYear());

    const modified = $("lastModified");

    if (modified) {
        modified.textContent =
            `Dernière modification de la page : ${document.lastModified}`;
    }
}

/* =========================================
   14. INITIALISATION
========================================= */

function initializeApp() {
    $("ajouterpieces")?.addEventListener("click", () => createRooms());

    $("calculersurfaces")?.addEventListener("click", calculateFloor);

    $("calculerMortierSol")?.addEventListener("click", calculateFloorMortar);

    $("calculerperimetre")?.addEventListener("click", calculatePerimeter);

    $("calculerplinthes")?.addEventListener("click", calculateSkirting);

    $("calculerfaience")?.addEventListener("click", calculateWall);

    $("genererDevis")?.addEventListener("click", generateQuote);

    $("imprimerDevis")?.addEventListener("click", printQuote);

    $("enregistrerProjet")?.addEventListener("click", saveProject);

    $("exporterDonnees")?.addEventListener("click", exportProjects);

    $("importerDonnees")?.addEventListener("change", importProjects);

    $("nouveauProjet")?.addEventListener("click", newProject);

    createRooms();
    renderProjects();
    updateFooter();
}

document.addEventListener("DOMContentLoaded", initializeApp);