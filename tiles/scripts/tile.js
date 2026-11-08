"use strict";

/* =========================================
   KIJ CARRELAGE PRO
   Moteur complet de calcul
========================================= */

/* =========================================
   1. CONFIGURATION ET ÉTAT
========================================= */

const STORAGE_KEY = "kijCarrelagePro_projects_v2";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const state = {
    rooms: [],
    floor: null,
    skirting: null,
    wall: null,
    materials: {},
    quoteLines: [],
    transport: 0,
    labor: 0,
    subtotal: 0,
    margin: 0,
    total: 0,
    lastCalculation: null
};

const DEFAULTS = {
    waste: 10,
    tileLength: 60,
    tileWidth: 60,
    tileThickness: 10,
    jointWidth: 3,
    tilesPerCarton: 4,
    dryFactor: 1.33,
    mortarMargin: 20,
    cementBagVolume: 0.035,
    sandDensity: 1.6
};


/* =========================================
   2. OUTILS GÉNÉRAUX
========================================= */

function getValue(id, fallback = "") {
    const element = document.getElementById(id);

    if (!element) return fallback;

    return element.value ?? fallback;
}

function getNumber(id, fallback = 0) {
    const value = Number(getValue(id));

    return Number.isFinite(value) ? value : fallback;
}

function isChecked(id) {
    return Boolean(document.getElementById(id)?.checked);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setHTML(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerHTML = value;
    }
}

function round(value, decimals = 2) {
    const factor = 10 ** decimals;

    return Math.round((value + Number.EPSILON) * factor) / factor;
}

function ceil(value) {
    return Math.ceil(value - 1e-10);
}

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function moneyFormat(value) {
    const currency = getValue("devise", "USD");

    try {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    } catch {
        return `${numberFormat(value)} ${currency}`;
    }
}

function numberFormat(value, decimals = 2) {
    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    }).format(Number(value) || 0);
}

function notify(message, type = "success") {
    const notification = $("#notification");

    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification show ${type}`;

    clearTimeout(notify.timeout);

    notify.timeout = setTimeout(() => {
        notification.className = "notification";
    }, 3500);
}

function showResult(id, content, type = "success") {
    const element = document.getElementById(id);

    if (!element) return;

    element.innerHTML = content;
    element.className = `result-message result-${type}`;
}

function clearResult(id) {
    const element = document.getElementById(id);

    if (element) {
        element.innerHTML = "";
        element.className = "result-message";
    }
}

function getProjectInfo() {
    return {
        name: getValue("nomProjet"),
        client: getValue("nomClient"),
        provider: getValue("nomPrestataire"),
        address: getValue("adresseProjet"),
        date: getValue("dateProjet"),
        currency: getValue("devise", "USD")
    };
}

function validPositive(value) {
    return Number.isFinite(value) && value > 0;
}

function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}


/* =========================================
   3. DIMENSIONS DES PIÈCES
========================================= */

function createRoomFields(index, shape = "rectangle") {
    const room = document.createElement("article");

    room.className = "room-card";
    room.dataset.roomIndex = index;

    room.innerHTML = `
        <h3>Pièce ${index + 1}</h3>

        <div class="field">
            <label for="nomPiece${index}">Nom de la pièce</label>
            <input type="text" id="nomPiece${index}"
                class="room-name" value="Pièce ${index + 1}"
                placeholder="Ex. Salon">
        </div>

        <div class="field">
            <label for="formePiece${index}">Forme géométrique</label>
            <select id="formePiece${index}" class="room-shape">
                <option value="rectangle">Rectangle</option>
                <option value="cercle">Cercle</option>
                <option value="trapeze">Trapèze</option>
                <option value="parallelogramme">Parallélogramme</option>
            </select>
        </div>

        <div class="room-fields" id="dimensionsPiece${index}"></div>

        <div class="room-actions">
            <button type="button"
                class="button button-danger button-small remove-room">
                Supprimer cette pièce
            </button>
        </div>
    `;

    $(".room-shape", room).value = shape;

    updateRoomDimensions(room, shape);

    return room;
}

function updateRoomDimensions(room, shape) {
    const container = $(".room-fields", room);

    if (!container) return;

    const index = room.dataset.roomIndex;

    const fields = {
        rectangle: `
            ${roomInput(index, "longueur", "Longueur (m)", 5)}
            ${roomInput(index, "largeur", "Largeur (m)", 4)}
        `,

        cercle: `
            ${roomInput(index, "rayon", "Rayon (m)", 2)}
        `,

        trapeze: `
            ${roomInput(index, "grandeBase", "Grande base (m)", 5)}
            ${roomInput(index, "petiteBase", "Petite base (m)", 3)}
            ${roomInput(index, "hauteur", "Hauteur (m)", 3)}
            ${roomInput(index, "coteGauche", "Côté gauche (m)", 3.2)}
            ${roomInput(index, "coteDroit", "Côté droit (m)", 3.2)}
        `,

        parallelogramme: `
            ${roomInput(index, "base", "Base (m)", 5)}
            ${roomInput(index, "hauteur", "Hauteur (m)", 3)}
            ${roomInput(index, "cote", "Côté oblique (m)", 3.5)}
        `
    };

    container.innerHTML = fields[shape] || fields.rectangle;
}

function roomInput(index, name, label, defaultValue) {
    return `
        <div class="field">
            <label for="${name}Piece${index}">${label}</label>
            <input type="number"
                id="${name}Piece${index}"
                class="room-dimension"
                data-dimension="${name}"
                min="0"
                step="0.01"
                value="${defaultValue}">
        </div>
    `;
}

function createRooms() {
    const container = $("#formulairespieces");

    if (!container) return;

    const count = Math.max(
        1,
        Math.min(100, Math.floor(getNumber("nombrepieces", 1)))
    );

    container.innerHTML = "";

    for (let index = 0; index < count; index++) {
        container.appendChild(createRoomFields(index));
    }

    state.rooms = [];
    clearAllResults();
}

function getRoomInput(room, name) {
    const input = $(`[data-dimension="${name}"]`, room);

    return input ? Number(input.value) : 0;
}

function calculateRoom(room) {
    const shape = $(".room-shape", room)?.value;
    const name = $(".room-name", room)?.value || "Pièce";

    let area = 0;
    let perimeter = 0;

    if (shape === "rectangle") {
        const length = getRoomInput(room, "longueur");
        const width = getRoomInput(room, "largeur");

        if (!validPositive(length) || !validPositive(width)) {
            return null;
        }

        area = length * width;
        perimeter = 2 * (length + width);
    }

    else if (shape === "cercle") {
        const radius = getRoomInput(room, "rayon");

        if (!validPositive(radius)) {
            return null;
        }

        area = Math.PI * radius ** 2;
        perimeter = 2 * Math.PI * radius;
    }

    else if (shape === "trapeze") {
        const largeBase = getRoomInput(room, "grandeBase");
        const smallBase = getRoomInput(room, "petiteBase");
        const height = getRoomInput(room, "hauteur");
        const left = getRoomInput(room, "coteGauche");
        const right = getRoomInput(room, "coteDroit");

        if (
            !validPositive(largeBase) ||
            !validPositive(smallBase) ||
            !validPositive(height) ||
            !validPositive(left) ||
            !validPositive(right)
        ) {
            return null;
        }

        if (smallBase > largeBase) {
            return null;
        }

        area = ((largeBase + smallBase) * height) / 2;
        perimeter = largeBase + smallBase + left + right;
    }

    else if (shape === "parallelogramme") {
        const base = getRoomInput(room, "base");
        const height = getRoomInput(room, "hauteur");
        const side = getRoomInput(room, "cote");

        if (
            !validPositive(base) ||
            !validPositive(height) ||
            !validPositive(side)
        ) {
            return null;
        }

        area = base * height;
        perimeter = 2 * (base + side);
    }

    if (!validPositive(area) || !validPositive(perimeter)) {
        return null;
    }

    return {
        name,
        shape,
        area,
        perimeter
    };
}

function calculateAllRooms() {
    const roomElements = $$(".room-card", $("#formulairespieces"));

    if (!roomElements.length) {
        notify("Ajoutez au moins une pièce.", "error");
        return null;
    }

    const rooms = [];

    for (const roomElement of roomElements) {
        const result = calculateRoom(roomElement);

        if (!result) {
            notify(
                "Vérifiez les dimensions de chaque pièce. Toutes doivent être positives et cohérentes.",
                "error"
            );

            return null;
        }

        rooms.push(result);
    }

    state.rooms = rooms;

    return rooms;
}


/* =========================================
   4. CONFIGURATION DES CARREAUX
========================================= */

function getTileConfig(surface) {
    const common = {
        length: getNumber("longueurCarreau", DEFAULTS.tileLength),
        width: getNumber("largeurCarreau", DEFAULTS.tileWidth),
        thickness: getNumber("epaisseurCarreau", DEFAULTS.tileThickness),
        joint: getNumber("largeurJoint", DEFAULTS.jointWidth),
        piecesPerCarton: getNumber("carreauxParCarton", DEFAULTS.tilesPerCarton),
        cartonArea: getNumber("surfaceCarton", 0)
    };

    const configurations = {
        sol: {
            checkbox: "utiliserDimensionsSol",
            length: "longueurCarreauSol",
            width: "largeurCarreauSol",
            thickness: "epaisseurCarreauSol",
            joint: "jointSol",
            pieces: "piecesCartonSol",
            carton: "surfaceCartonSol"
        },

        plinthes: {
            checkbox: "utiliserDimensionsPlinthes",
            length: "longueurCarreauPlinthes",
            width: "largeurCarreauPlinthes",
            thickness: "epaisseurCarreauPlinthes",
            joint: "jointPlinthes",
            pieces: "piecesCartonPlinthes",
            carton: "surfaceCartonPlinthes"
        },

        murs: {
            checkbox: "utiliserDimensionsMurs",
            length: "longueurCarreauMurs",
            width: "largeurCarreauMurs",
            thickness: "epaisseurCarreauMurs",
            joint: "jointMurs",
            pieces: "piecesCartonMurs",
            carton: "surfaceCartonMurs"
        }
    };

    const config = configurations[surface];

    if (!config || !isChecked(config.checkbox)) {
        return common;
    }

    return {
        length: getNumber(config.length, common.length),
        width: getNumber(config.width, common.width),
        thickness: getNumber(config.thickness, common.thickness),
        joint: getNumber(config.joint, common.joint),
        piecesPerCarton: getNumber(config.pieces, common.piecesPerCarton),
        cartonArea: getNumber(config.carton, 0)
    };
}

function calculateTiles(area, wasteRate, config) {
    if (
        !validPositive(area) ||
        !validPositive(config.length) ||
        !validPositive(config.width)
    ) {
        return null;
    }

    const tileArea = (config.length * config.width) / 10000;
    const areaWithWaste = area * (1 + wasteRate / 100);

    const pieces = ceil(areaWithWaste / tileArea);

    let cartons = 0;
    let purchasedArea = 0;

    if (validPositive(config.cartonArea)) {
        cartons = ceil(areaWithWaste / config.cartonArea);
        purchasedArea = cartons * config.cartonArea;
    } else if (validPositive(config.piecesPerCarton)) {
        cartons = ceil(pieces / config.piecesPerCarton);
        purchasedArea = cartons * config.piecesPerCarton * tileArea;
    }

    return {
        area,
        wasteRate,
        areaWithWaste,
        tileArea,
        pieces,
        cartons,
        purchasedArea,
        length: config.length,
        width: config.width,
        thickness: config.thickness
    };
}


/* =========================================
   5. CALCUL DU SOL
========================================= */

function calculateFloor() {
    const rooms = calculateAllRooms();

    if (!rooms) return null;

    const area = sum(rooms.map(room => room.area));
    const perimeter = sum(rooms.map(room => room.perimeter));

    const wasteRate = getNumber("tauxpertes", DEFAULTS.waste);
    const tiles = calculateTiles(
        area,
        wasteRate,
        getTileConfig("sol")
    );

    if (!tiles) {
        notify("Vérifiez les dimensions des carreaux du sol.", "error");
        return null;
    }

    state.floor = {
        area,
        perimeter,
        rooms,
        tiles
    };

    showResult("resultatsurface", `
        <strong>Résultats du métré du sol</strong>

        <div class="result-grid">
            <div class="result-card">
                <small>Surface totale</small>
                <strong>${numberFormat(area)} m²</strong>
            </div>

            <div class="result-card">
                <small>Périmètre cumulé</small>
                <strong>${numberFormat(perimeter)} m</strong>
            </div>

            <div class="result-card">
                <small>Surface avec pertes</small>
                <strong>${numberFormat(tiles.areaWithWaste)} m²</strong>
            </div>

            <div class="result-card">
                <small>Nombre de carreaux</small>
                <strong>${tiles.pieces}</strong>
            </div>

            <div class="result-card">
                <small>Nombre de cartons</small>
                <strong>${tiles.cartons || "À déterminer"}</strong>
            </div>
        </div>

        <ul>
            ${rooms.map(room => `
                <li>
                    ${safe(room.name)} :
                    ${numberFormat(room.area)} m² —
                    périmètre ${numberFormat(room.perimeter)} m
                </li>
            `).join("")}
        </ul>
    `);

    updateAllResults();

    return state.floor;
}


/* =========================================
   6. CALCUL DU PÉRIMÈTRE ET DES PLINTHES
========================================= */

function calculatePerimeter() {
    const rooms = calculateAllRooms();

    if (!rooms) return null;

    const perimeter = sum(rooms.map(room => room.perimeter));
    const deductions = getNumber("deductionOuverturesPlinthes", 0);

    if (deductions < 0 || deductions > perimeter) {
        notify("Vérifiez la largeur des ouvertures à déduire.", "error");
        return null;
    }

    const netPerimeter = perimeter - deductions;

    showResult("resultatperimetre", `
        <strong>Calcul du périmètre</strong>
        <p>Périmètre total : ${numberFormat(perimeter)} m</p>
        <p>Ouvertures déduites : ${numberFormat(deductions)} m</p>
        <p><strong>Périmètre net : ${numberFormat(netPerimeter)} m</strong></p>
    `);

    return netPerimeter;
}

function calculateSkirting() {
    const perimeter = calculatePerimeter();

    if (perimeter === null) return null;

    const height = getNumber("hauteurplinthe", 0);

    if (!validPositive(height)) {
        notify("Entrez une hauteur de plinthe valide.", "error");
        return null;
    }

    const area = perimeter * (height / 100);
    const waste = getNumber("pertesPlinthes", 10);

    const tiles = calculateTiles(
        area,
        waste,
        getTileConfig("plinthes")
    );

    if (!tiles) {
        notify("Vérifiez les dimensions des carreaux des plinthes.", "error");
        return null;
    }

    state.skirting = {
        perimeter,
        height,
        area,
        tiles
    };

    showResult("resultatplinthes", `
        <strong>Résultats des plinthes</strong>

        <div class="result-grid">
            <div class="result-card">
                <small>Périmètre net</small>
                <strong>${numberFormat(perimeter)} m</strong>
            </div>

            <div class="result-card">
                <small>Hauteur</small>
                <strong>${numberFormat(height)} cm</strong>
            </div>

            <div class="result-card">
                <small>Surface nette</small>
                <strong>${numberFormat(area)} m²</strong>
            </div>

            <div class="result-card">
                <small>Surface avec pertes</small>
                <strong>${numberFormat(tiles.areaWithWaste)} m²</strong>
            </div>

            <div class="result-card">
                <small>Nombre de carreaux</small>
                <strong>${tiles.pieces}</strong>
            </div>

            <div class="result-card">
                <small>Nombre de cartons</small>
                <strong>${tiles.cartons || "À déterminer"}</strong>
            </div>
        </div>
    `);

    updateAllResults();

    return state.skirting;
}


/* =========================================
   7. CALCUL DES MURS ET FAÏENCES
========================================= */

function calculateWall() {
    const length = getNumber("longueurpiece", 0);
    const height = getNumber("largeurpiece", 0);
    const openings = getNumber("ouverturesMurs", 0);

    if (!validPositive(length) || !validPositive(height)) {
        notify("Entrez la longueur et la hauteur des murs.", "error");
        return null;
    }

    const grossArea = length * height;

    if (openings < 0 || openings >= grossArea) {
        notify("Vérifiez la surface des ouvertures à déduire.", "error");
        return null;
    }

    const area = grossArea - openings;
    const waste = getNumber("pertesMurs", 10);

    const tiles = calculateTiles(
        area,
        waste,
        getTileConfig("murs")
    );

    if (!tiles) {
        notify("Vérifiez les dimensions des carreaux muraux.", "error");
        return null;
    }

    state.wall = {
        length,
        height,
        grossArea,
        openings,
        area,
        tiles
    };

    showResult("resultatfaience", `
        <strong>Résultats des murs et faïences</strong>

        <div class="result-grid">
            <div class="result-card">
                <small>Surface brute</small>
                <strong>${numberFormat(grossArea)} m²</strong>
            </div>

            <div class="result-card">
                <small>Ouvertures déduites</small>
                <strong>${numberFormat(openings)} m²</strong>
            </div>

            <div class="result-card">
                <small>Surface nette</small>
                <strong>${numberFormat(area)} m²</strong>
            </div>

            <div class="result-card">
                <small>Surface avec pertes</small>
                <strong>${numberFormat(tiles.areaWithWaste)} m²</strong>
            </div>

            <div class="result-card">
                <small>Nombre de carreaux</small>
                <strong>${tiles.pieces}</strong>
            </div>

            <div class="result-card">
                <small>Nombre de cartons</small>
                <strong>${tiles.cartons || "À déterminer"}</strong>
            </div>
        </div>
    `);

    updateAllResults();

    return state.wall;
}


/* =========================================
   8. CALCUL DES MORTIERS TRADITIONNELS
========================================= */

function calculateTraditionalMortar(area, thicknessCm, cementRatio, sandRatio, dryFactor, margin, bagVolume, sandDensity) {
    if (
        !validPositive(area) ||
        !validPositive(thicknessCm) ||
        !validPositive(cementRatio) ||
        !validPositive(sandRatio) ||
        !validPositive(dryFactor) ||
        bagVolume <= 0 ||
        sandDensity <= 0
    ) {
        return null;
    }

    const wetVolume = area * (thicknessCm / 100);

    const dryVolume = wetVolume *
        dryFactor *
        (1 + margin / 100);

    const totalParts = cementRatio + sandRatio;

    const cementVolume = dryVolume * cementRatio / totalParts;
    const sandVolume = dryVolume * sandRatio / totalParts;

    const cementBags = ceil(cementVolume / bagVolume);
    const sandTonnes = sandVolume * sandDensity;

    return {
        wetVolume,
        dryVolume,
        cementVolume,
        sandVolume,
        cementBags,
        sandTonnes
    };
}

function calculateFloorMortar() {
    if (!state.floor && !calculateFloor()) return null;

    const area = state.floor.tiles.areaWithWaste;

    const result = calculateTraditionalMortar(
        area,
        getNumber("epaisseurMortierSol", 3),
        getNumber("ratioCimentSol", 1),
        getNumber("ratioSableSol", 4),
        getNumber("facteurSecSol", DEFAULTS.dryFactor),
        getNumber("margeMortierSol", DEFAULTS.mortarMargin),
        getNumber("volumeSacCimentSol", DEFAULTS.cementBagVolume),
        getNumber("densiteSableSol", DEFAULTS.sandDensity)
    );

    if (!result) {
        notify("Vérifiez les paramètres du mortier du sol.", "error");
        return null;
    }

    state.floor.mortar = result;

    showResult("resultatMortierSol", `
        <strong>Mortier traditionnel du sol</strong>

        <div class="result-grid">
            <div class="result-card">
                <small>Volume frais</small>
                <strong>${numberFormat(result.wetVolume)} m³</strong>
            </div>

            <div class="result-card">
                <small>Volume sec estimé</small>
                <strong>${numberFormat(result.dryVolume)} m³</strong>
            </div>

            <div class="result-card">
                <small>Ciment</small>
                <strong>${result.cementBags} sacs</strong>
            </div>

            <div class="result-card">
                <small>Sable</small>
                <strong>${numberFormat(result.sandTonnes)} tonnes</strong>
            </div>
        </div>
    `);

    updateAllResults();

    return result;
}


/* =========================================
   9. CALCUL DES MÉTHODES DE POSE
========================================= */

function calculateAdhesive(area, consumption, bagWeight) {
    if (
        !validPositive(area) ||
        !validPositive(consumption) ||
        !validPositive(bagWeight)
    ) {
        return null;
    }

    const totalKg = area * consumption;

    return {
        totalKg,
        bags: ceil(totalKg / bagWeight),
        bagWeight
    };
}

function getSurfaceMethod(surface) {
    const id = {
        sol: "methodePoseSol",
        plinthes: "methodePosePlinthes",
        murs: "methodePoseMurs"
    }[surface];

    return getValue(id, "traditional");
}

function calculateSurfaceMaterials(surface, data) {
    if (!data) return null;

    const area = data.tiles.areaWithWaste;
    const method = getSurfaceMethod(surface);

    let materialResult;

    if (method === "traditional") {
        let thickness;
        let cementRatio;
        let sandRatio;
        let dryFactor = DEFAULTS.dryFactor;
        let margin = DEFAULTS.mortarMargin;
        let bagVolume = DEFAULTS.cementBagVolume;
        let density = DEFAULTS.sandDensity;

        if (surface === "sol") {
            thickness = getNumber("epaisseurMortierSol", 3);
            cementRatio = getNumber("ratioCimentSol", 1);
            sandRatio = getNumber("ratioSableSol", 4);
            dryFactor = getNumber("facteurSecSol", 1.33);
            margin = getNumber("margeMortierSol", 20);
            bagVolume = getNumber("volumeSacCimentSol", 0.035);
            density = getNumber("densiteSableSol", 1.6);
        } else if (surface === "plinthes") {
            thickness = getNumber("epaisseurMortierPlinthes", 1.5);
            cementRatio = getNumber("ratioCimentPlinthes", 1);
            sandRatio = getNumber("ratioSablePlinthes", 4);
        } else {
            thickness = getNumber("epaisseurMortierMurs", 1.5);
            cementRatio = getNumber("ratioCimentMurs", 1);
            sandRatio = getNumber("ratioSableMurs", 4);
        }

        materialResult = calculateTraditionalMortar(
            area,
            thickness,
            cementRatio,
            sandRatio,
            dryFactor,
            margin,
            bagVolume,
            density
        );

        if (!materialResult) return null;

        return {
            method,
            mortar: materialResult,
            adhesive: null
        };
    }

    let consumption;
    let bagWeight;

    if (surface === "sol") {
        consumption = getNumber("consommationColleSol", 4);
        bagWeight = getNumber("poidsSacColleSol", 25);
    } else if (surface === "plinthes") {
        consumption = getNumber("consommationCollePlinthes", 4);
        bagWeight = getNumber("poidsSacCollePlinthes", 25);
    } else {
        consumption = getNumber("consommationColleMurs", 4);
        bagWeight = getNumber("poidsSacColleMurs", 25);
    }

    materialResult = calculateAdhesive(area, consumption, bagWeight);

    if (!materialResult) return null;

    return {
        method,
        mortar: null,
        adhesive: materialResult
    };
}

function calculateAllLayingMaterials() {
    if (!state.floor && !calculateFloor()) return false;

    if (!state.skirting && !calculateSkirting()) return false;

    const surfaces = [
        ["sol", state.floor],
        ["plinthes", state.skirting],
        ["murs", state.wall]
    ];

    for (const [name, data] of surfaces) {
        if (!data) continue;

        data.laying = calculateSurfaceMaterials(name, data);

        if (!data.laying) {
            notify(`Vérifiez les paramètres de pose : ${name}.`, "error");
            return false;
        }
    }

    return true;
}


/* =========================================
   10. JOINTS ET ACCESSOIRES
========================================= */

function calculateGrout(area, config) {
    if (
        !validPositive(area) ||
        !validPositive(config.length) ||
        !validPositive(config.width)
    ) {
        return 0;
    }

    const lengthMm = config.length * 10;
    const widthMm = config.width * 10;
    const tileThickness = config.thickness;
    const joint = config.joint;
    const density = getNumber("densiteJoint", 1.6);
    const waste = getNumber("margeJoint", 10);

    if (!validPositive(density) || joint <= 0) return 0;

    /*
       Formule indicative :
       consommation kg/m² =
       ((L + l) / (L × l)) × largeur joint × épaisseur carreau
       × densité / 1000
    */

    const consumption =
        ((lengthMm + widthMm) / (lengthMm * widthMm)) *
        joint *
        tileThickness *
        density;

    return area * consumption * (1 + waste / 100);
}

function calculateAccessories() {
    const surfaces = [
        ["sol", state.floor],
        ["plinthes", state.skirting],
        ["murs", state.wall]
    ];

    const totalTiles = sum(
        surfaces
            .filter(([, data]) => data)
            .map(([, data]) => data.tiles.pieces)
    );

    const totalGrout = sum(
        surfaces
            .filter(([, data]) => data)
            .map(([name, data]) =>
                calculateGrout(data.tiles.areaWithWaste, getTileConfig(name))
            )
    );

    const margin = getNumber("margeAccessoires", 5);

    const crosses = isChecked("inclureCroisillons")
        ? ceil(totalTiles * getNumber("croisillonsParCarreau", 4) *
            (1 + margin / 100))
        : 0;

    const clips = isChecked("inclureClips")
        ? ceil(totalTiles * getNumber("clipsParCarreau", 4) *
            (1 + margin / 100))
        : 0;

    const jointBags = isChecked("inclureJointCarrelage")
        ? ceil(totalGrout / getNumber("poidsSacJoint", 5))
        : 0;

    const result = {
        totalTiles,
        groutKg: isChecked("inclureJointCarrelage") ? totalGrout : 0,
        jointBags,
        crosses,
        clips,
        whiteCement: isChecked("inclureCimentBlanc"),
        wedges: isChecked("inclureCales")
    };

    state.materials.accessories = result;

    return result;
}


/* =========================================
   11. MATÉRIAUX TOTAUX
========================================= */

function calculateAllMaterials() {
    if (!calculateAllLayingMaterials()) return null;

    const surfaces = [
        state.floor,
        state.skirting,
        state.wall
    ].filter(Boolean);

    const cementBags = sum(
        surfaces.map(data => data.laying?.mortar?.cementBags || 0)
    );

    const sandTonnes = sum(
        surfaces.map(data => data.laying?.mortar?.sandTonnes || 0)
    );

    const adhesiveKg = sum(
        surfaces.map(data => data.laying?.adhesive?.totalKg || 0)
    );

    const adhesiveBags = sum(
        surfaces.map(data => data.laying?.adhesive?.bags || 0)
    );

    const accessories = calculateAccessories();

    state.materials = {
        ...state.materials,
        cementBags,
        sandTonnes,
        adhesiveKg,
        adhesiveBags,
        accessories
    };

    return state.materials;
}


/* =========================================
   12. TRANSPORT ET LOGISTIQUE
========================================= */

function calculateTransport() {
    const mode = getValue("modeTransport", "trip");

    let trips = Math.max(1, Math.floor(getNumber("nombreVoyages", 1)));

    const capacity = getNumber("capaciteVehicule", 0);
    const estimatedWeight = getNumber("poidsEstimeMateriaux", 0);

    if (validPositive(capacity) && validPositive(estimatedWeight)) {
        trips = Math.max(trips, ceil(estimatedWeight / capacity));
    }

    let transportCost = 0;

    if (mode === "trip") {
        transportCost = trips * getNumber("tarifVoyage", 0);
    }

    else if (mode === "distance") {
        const roundTripDistance = getNumber("distanceTransport", 0) * 2;

        transportCost =
            roundTripDistance *
            trips *
            getNumber("tarifKilometre", 0);
    }

    else if (mode === "fixed") {
        transportCost = getNumber("forfaitTransport", 0);
    }

    const handling = getNumber("chargementTransport", 0);
    const other = getNumber("autresFraisTransport", 0);

    const total = transportCost + handling + other;

    state.transport = {
        mode,
        trips,
        transportCost,
        handling,
        other,
        total
    };

    return state.transport;
}


/* =========================================
   13. PRIX ET LIGNES DE DEVIS
========================================= */

function addQuoteLine(lines, designation, quantity, unit, unitPrice, options = {}) {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;

    if (qty <= 0) return;

    lines.push({
        designation,
        quantity: qty,
        unit,
        unitPrice: price,
        subtotal: qty * price,
        category: options.category || "Matériaux",
        note: options.note || ""
    });
}

function getPrice(id) {
    return Math.max(0, getNumber(id, 0));
}

function createQuoteLines() {
    const lines = [];

    if (!state.floor && !calculateFloor()) return [];

    if (!state.skirting && !calculateSkirting()) return [];

    if (!state.materials.cementBags && !calculateAllMaterials()) {
        // Le calcul global est aussi exécuté lorsque le ciment n'est pas nécessaire.
    }

    const floorArea = state.floor?.tiles.areaWithWaste || 0;
    const skirtingArea = state.skirting?.tiles.areaWithWaste || 0;
    const wallArea = state.wall?.tiles.areaWithWaste || 0;

    addQuoteLine(
        lines,
        "Carrelage de sol avec pertes",
        floorArea,
        "m²",
        getPrice("prixCarreaux"),
        { category: "Revêtements" }
    );

    addQuoteLine(
        lines,
        "Carreaux des plinthes avec pertes",
        skirtingArea,
        "m²",
        getPrice("prixPlinthes"),
        { category: "Revêtements" }
    );

    addQuoteLine(
        lines,
        "Faïence / revêtement mural avec pertes",
        wallArea,
        "m²",
        getPrice("prixFaience"),
        { category: "Revêtements" }
    );

    const materials = state.materials;

    addQuoteLine(
        lines,
        "Ciment pour mortier traditionnel",
        materials.cementBags,
        "sac",
        getPrice("prixCiment")
    );

    addQuoteLine(
        lines,
        "Sable pour mortier traditionnel",
        materials.sandTonnes,
        "tonne",
        getPrice("prixSable")
    );

    addQuoteLine(
        lines,
        "Ciment-colle",
        materials.adhesiveBags,
        "sac",
        getPrice("prixCimentColle")
    );

    if (materials.accessories?.whiteCement) {
        addQuoteLine(
            lines,
            "Ciment blanc",
            1,
            "lot",
            getPrice("prixCimentBlanc")
        );
    }

    if (materials.accessories?.jointBags) {
        addQuoteLine(
            lines,
            "Produit de joint pour carrelage",
            materials.accessories.jointBags,
            "sac",
            getPrice("prixJoint")
        );
    }

    if (materials.accessories?.crosses) {
        const packets = ceil(
            materials.accessories.crosses /
            Math.max(1, getNumber("croisillonsParPaquet", 100))
        );

        addQuoteLine(
            lines,
            "Croisillons",
            packets,
            "paquet",
            getPrice("prixCroisillons")
        );
    }

    if (materials.accessories?.clips) {
        const packets = ceil(
            materials.accessories.clips /
            Math.max(1, getNumber("clipsParPaquet", 100))
        );

        addQuoteLine(
            lines,
            "Clips de nivellement",
            packets,
            "paquet",
            getPrice("prixClips")
        );
    }

    if (materials.accessories?.wedges) {
        addQuoteLine(
            lines,
            "Cales et coins de nivellement",
            1,
            "lot",
            getPrice("prixCales")
        );
    }

    state.quoteLines = lines;

    return lines;
}


/* =========================================
   14. MAIN-D'ŒUVRE ET COÛTS
========================================= */

function calculateLabor() {
    const totalArea =
        (state.floor?.area || 0) +
        (state.skirting?.area || 0) +
        (state.wall?.area || 0);

    const rate = getPrice("prixMainOeuvre");

    state.labor = {
        area: totalArea,
        rate,
        total: totalArea * rate
    };

    return state.labor;
}

function calculateFinancialSummary() {
    if (!state.materials.cementBags && !calculateAllMaterials()) {
        // On continue seulement si les surfaces ne nécessitent pas de mortier.
    }

    const lines = createQuoteLines();
    const transport = calculateTransport();
    const labor = calculateLabor();

    const materialTotal = sum(lines.map(line => line.subtotal));

    const otherCosts = getPrice("autresCouts");

    const subtotal =
        materialTotal +
        transport.total +
        labor.total +
        otherCosts;

    const marginRate = getNumber("margeBeneficiaire", 0);
    const margin = subtotal * marginRate / 100;

    const total = subtotal + margin;

    state.subtotal = subtotal;
    state.margin = margin;
    state.total = total;

    state.financial = {
        materialTotal,
        transport: transport.total,
        labor: labor.total,
        otherCosts,
        subtotal,
        marginRate,
        margin,
        total
    };

    return state.financial;
}


/* =========================================
   15. TABLEAU RÉCAPITULATIF
========================================= */

function addSummaryRow(tbody, designation, quantity, unit, observation) {
    const row = document.createElement("tr");

    const values = [
        designation,
        numberFormat(quantity),
        unit,
        observation
    ];

    values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    });

    tbody.appendChild(row);
}

function updateSummary() {
    const tbody = $("#tableauResultats");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!state.floor && !state.skirting && !state.wall) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-cell">
                    Aucun calcul effectué pour le moment.
                </td>
            </tr>
        `;

        return;
    }

    if (state.floor) {
        addSummaryRow(
            tbody,
            "Surface du sol",
            state.floor.area,
            "m²",
            "Surface nette"
        );

        addSummaryRow(
            tbody,
            "Carrelage du sol avec pertes",
            state.floor.tiles.areaWithWaste,
            "m²",
            `${state.floor.tiles.pieces} carreaux`
        );

        addSummaryRow(
            tbody,
            "Cartons de carrelage du sol",
            state.floor.tiles.cartons,
            "carton",
            "Arrondi à l'unité supérieure"
        );
    }

    if (state.skirting) {
        addSummaryRow(
            tbody,
            "Surface des plinthes",
            state.skirting.area,
            "m²",
            "Surface nette"
        );

        addSummaryRow(
            tbody,
            "Plinthes avec pertes",
            state.skirting.tiles.areaWithWaste,
            "m²",
            `${state.skirting.tiles.pieces} carreaux`
        );

        addSummaryRow(
            tbody,
            "Cartons des plinthes",
            state.skirting.tiles.cartons,
            "carton",
            "Arrondi à l'unité supérieure"
        );
    }

    if (state.wall) {
        addSummaryRow(
            tbody,
            "Surface des murs",
            state.wall.area,
            "m²",
            "Après déduction des ouvertures"
        );

        addSummaryRow(
            tbody,
            "Faïence avec pertes",
            state.wall.tiles.areaWithWaste,
            "m²",
            `${state.wall.tiles.pieces} carreaux`
        );

        addSummaryRow(
            tbody,
            "Cartons de faïence",
            state.wall.tiles.cartons,
            "carton",
            "Arrondi à l'unité supérieure"
        );
    }

    if (state.materials.cementBags > 0) {
        addSummaryRow(
            tbody,
            "Ciment pour mortier",
            state.materials.cementBags,
            "sac",
            "Sacs de 50 kg selon hypothèse de volume"
        );
    }

    if (state.materials.sandTonnes > 0) {
        addSummaryRow(
            tbody,
            "Sable",
            state.materials.sandTonnes,
            "tonne",
            "Masse estimée"
        );
    }

    if (state.materials.adhesiveBags > 0) {
        addSummaryRow(
            tbody,
            "Ciment-colle",
            state.materials.adhesiveBags,
            "sac",
            `${numberFormat(state.materials.adhesiveKg)} kg estimés`
        );
    }

    const accessories = state.materials.accessories;

    if (accessories) {
        if (accessories.jointBags > 0) {
            addSummaryRow(
                tbody,
                "Produit de joint",
                accessories.jointBags,
                "sac",
                `${numberFormat(accessories.groutKg)} kg estimés`
            );
        }

        if (accessories.crosses > 0) {
            addSummaryRow(
                tbody,
                "Croisillons",
                accessories.crosses,
                "pièce",
                "Quantité indicative"
            );
        }

        if (accessories.clips > 0) {
            addSummaryRow(
                tbody,
                "Clips de nivellement",
                accessories.clips,
                "pièce",
                "Quantité indicative"
            );
        }
    }

    setText(
        "resultStatus",
        "Les quantités calculées sont disponibles ci-dessous."
    );
}

function updateAllResults() {
    calculateAllMaterials();
    updateSummary();

    if (state.floor || state.skirting || state.wall) {
        calculateFinancialSummary();
    }
}


/* =========================================
   16. GÉNÉRATION DU DEVIS
========================================= */

function generateQuote() {
    if (!state.floor && !calculateFloor()) return;

    if (!state.skirting && !calculateSkirting()) return;

    if (!calculateAllMaterials()) return;

    const financial = calculateFinancialSummary();

    const project = getProjectInfo();

    const date = project.date ||
        new Date().toISOString().slice(0, 10);

    const lines = state.quoteLines;

    const rows = lines.map(line => `
        <tr>
            <td>${safe(line.designation)}</td>
            <td>${numberFormat(line.quantity)}</td>
            <td>${safe(line.unit)}</td>
            <td>${moneyFormat(line.unitPrice)}</td>
            <td>${moneyFormat(line.subtotal)}</td>
        </tr>
    `).join("");

    const transport = state.transport;
    const labor = state.labor;

    const quote = `
        <div class="quote-header">
            <h1>KIJ CARRELAGE PRO</h1>
            <h2>DEVIS ESTIMATIF DE TRAVAUX DE CARRELAGE</h2>
            <p>Document établi sur la base des métrés et paramètres renseignés.</p>
        </div>

        <hr>

        <div class="quote-meta">
            <p><strong>Projet :</strong> ${safe(project.name || "Non renseigné")}</p>
            <p><strong>Date :</strong> ${safe(date)}</p>
        </div>

        <p><strong>Client :</strong> ${safe(project.client || "Non renseigné")}</p>
        <p><strong>Prestataire :</strong> ${safe(project.provider || "Non renseigné")}</p>
        <p><strong>Adresse du chantier :</strong> ${safe(project.address || "Non renseignée")}</p>

        <h3>1. Détail estimatif des fournitures</h3>

        <table>
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>Prix unitaire</th>
                    <th>Montant</th>
                </tr>
            </thead>

            <tbody>
                ${rows || `
                    <tr>
                        <td colspan="5">Aucune ligne de fourniture.</td>
                    </tr>
                `}
            </tbody>
        </table>

        <h3>2. Main-d'œuvre</h3>

        <table>
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>Prix unitaire</th>
                    <th>Montant</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Travaux de pose</td>
                    <td>${numberFormat(labor.area)}</td>
                    <td>m²</td>
                    <td>${moneyFormat(labor.rate)}</td>
                    <td>${moneyFormat(labor.total)}</td>
                </tr>
            </tbody>
        </table>

        <h3>3. Transport et logistique</h3>

        <table>
            <tbody>
                <tr>
                    <td>Transport</td>
                    <td>${moneyFormat(transport.transportCost)}</td>
                </tr>
                <tr>
                    <td>Chargement et manutention</td>
                    <td>${moneyFormat(transport.handling)}</td>
                </tr>
                <tr>
                    <td>Autres frais logistiques</td>
                    <td>${moneyFormat(transport.other)}</td>
                </tr>
                <tr>
                    <th>Total transport et logistique</th>
                    <th>${moneyFormat(transport.total)}</th>
                </tr>
            </tbody>
        </table>

        <h3>4. Récapitulatif financier</h3>

        <table>
            <tbody>
                <tr>
                    <td>Total fournitures</td>
                    <td>${moneyFormat(financial.materialTotal)}</td>
                </tr>
                <tr>
                    <td>Main-d'œuvre</td>
                    <td>${moneyFormat(financial.labor)}</td>
                </tr>
                <tr>
                    <td>Transport et logistique</td>
                    <td>${moneyFormat(financial.transport)}</td>
                </tr>
                <tr>
                    <td>Autres coûts</td>
                    <td>${moneyFormat(financial.otherCosts)}</td>
                </tr>
                <tr>
                    <th>Sous-total</th>
                    <th>${moneyFormat(financial.subtotal)}</th>
                </tr>
                <tr>
                    <td>Marge bénéficiaire (${numberFormat(financial.marginRate)} %)</td>
                    <td>${moneyFormat(financial.margin)}</td>
                </tr>
            </tbody>
        </table>

        <p class="quote-total">
            TOTAL GÉNÉRAL : ${moneyFormat(financial.total)}
        </p>

        <h3>5. Conditions et délais</h3>

        <p>
            <strong>Délai estimatif :</strong>
            ${safe(getValue("delaiExecution", "À convenir"))}
        </p>

        <p>
            <strong>Validité du devis :</strong>
            ${safe(getValue("validiteDevis", "À convenir"))}
        </p>

        <p class="disclaimer">
            Ce document constitue une estimation basée sur les informations
            communiquées. Les quantités, prix et conditions doivent être
            confirmés avant exécution et commande.
        </p>

        <div class="quote-signatures">
            <div>
                <strong>Le client</strong>
            </div>

            <div>
                <strong>Le prestataire</strong>
            </div>
        </div>
    `;

    setHTML("zoneDevis", quote);

    notify("Le devis a été généré.", "success");

    $("#sectionDevis")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================
   17. IMPRESSION / PDF
========================================= */

function printQuote() {
    if (!$("#zoneDevis")?.innerHTML.trim() ||
        $("#zoneDevis").textContent.includes("sera affiché ici")) {
        generateQuote();
    }

    if (!$("#zoneDevis")?.innerHTML.trim()) {
        notify("Générez d'abord un devis.", "error");
        return;
    }

    window.print();
}


/* =========================================
   18. SAUVEGARDE ET RESTAURATION
========================================= */

function getAllFormData() {
    const data = {};

    $$("input, select, textarea").forEach(element => {
        if (!element.id || element.id === "importerDonnees") return;

        if (element.type === "checkbox") {
            data[element.id] = element.checked;
        } else if (element.type !== "file") {
            data[element.id] = element.value;
        }
    });

    data.rooms = $$(".room-card", $("#formulairespieces")).map(room => {
        const dimensions = {};

        $$(".room-dimension", room).forEach(input => {
            dimensions[input.dataset.dimension] = input.value;
        });

        return {
            name: $(".room-name", room)?.value || "",
            shape: $(".room-shape", room)?.value || "rectangle",
            dimensions
        };
    });

    return data;
}

function applyFormData(data) {
    if (!data || typeof data !== "object") return;

    Object.entries(data).forEach(([id, value]) => {
        if (id === "rooms" || id === "calculations") return;

        const element = document.getElementById(id);

        if (!element || element.type === "file") return;

        if (element.type === "checkbox") {
            element.checked = Boolean(value);
        } else {
            element.value = value;
        }
    });

    if (Array.isArray(data.rooms)) {
        const container = $("#formulairespieces");

        container.innerHTML = "";

        data.rooms.forEach((savedRoom, index) => {
            const room = createRoomFields(index, savedRoom.shape);

            $(".room-name", room).value = savedRoom.name || `Pièce ${index + 1}`;

            Object.entries(savedRoom.dimensions || {}).forEach(([name, value]) => {
                const input = $(`[data-dimension="${name}"]`, room);

                if (input) input.value = value;
            });

            container.appendChild(room);
        });

        if ($("#nombrepieces")) {
            $("#nombrepieces").value = data.rooms.length;
        }
    }

    updateMethodPanels();
    updateDimensionPanels();
}

function getSavedProjects() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveProject() {
    const project = getProjectInfo();

    if (!project.name.trim()) {
        notify("Donnez un nom au projet avant de l'enregistrer.", "error");
        return;
    }

    const projects = getSavedProjects();

    const projectId = globalThis.crypto?.randomUUID?.() ||
        `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const existingIndex = projects.findIndex(
        item => item.name === project.name &&
            item.client === project.client
    );

    const savedProject = {
        id: existingIndex >= 0 ? projects[existingIndex].id : projectId,
        name: project.name,
        client: project.client,
        date: project.date || new Date().toISOString().slice(0, 10),
        data: getAllFormData(),
        savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        projects[existingIndex] = savedProject;
    } else {
        projects.push(savedProject);
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

        renderSavedProjects();

        notify("Projet enregistré avec succès.");
    } catch {
        notify(
            "Impossible d'enregistrer. Le stockage du navigateur est peut-être plein.",
            "error"
        );
    }
}

function loadProject(id) {
    const project = getSavedProjects().find(item => item.id === id);

    if (!project) {
        notify("Projet introuvable.", "error");
        return;
    }

    applyFormData(project.data);

    clearAllResults();

    state.floor = null;
    state.skirting = null;
    state.wall = null;
    state.materials = {};

    notify(`Projet chargé : ${project.name}`);

    $("#informationsProjet")?.scrollIntoView({
        behavior: "smooth"
    });
}

function deleteProject(id) {
    const projects = getSavedProjects();

    const updated = projects.filter(item => item.id !== id);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        renderSavedProjects();

        notify("Projet supprimé.");
    } catch {
        notify("Impossible de supprimer ce projet.", "error");
    }
}

function renderSavedProjects() {
    const tbody = $("#listeProjets");

    if (!tbody) return;

    const projects = getSavedProjects();

    tbody.innerHTML = "";

    if (!projects.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-cell">
                    Aucun projet enregistré.
                </td>
            </tr>
        `;

        return;
    }

    projects.forEach(project => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${safe(project.name)}</td>
            <td>${safe(project.client || "Non renseigné")}</td>
            <td>${safe(project.date || "")}</td>
            <td>
                <button type="button"
                    class="button button-primary button-small load-project"
                    data-id="${safe(project.id)}">
                    Charger
                </button>

                <button type="button"
                    class="button button-danger button-small delete-project"
                    data-id="${safe(project.id)}">
                    Supprimer
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


/* =========================================
   19. EXPORTATION ET IMPORTATION JSON
========================================= */

function exportProjects() {
    const projects = getSavedProjects();

    if (!projects.length) {
        notify("Aucun projet à exporter.", "error");
        return;
    }

    const content = JSON.stringify(projects, null, 2);

    const blob = new Blob([content], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `kij-carrelage-pro-${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    notify("Exportation JSON terminée.");
}

function importProjects(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);

            if (!Array.isArray(imported)) {
                throw new Error("Format JSON invalide");
            }

            const existing = getSavedProjects();

            const validProjects = imported.filter(project =>
                project &&
                typeof project.id === "string" &&
                project.data &&
                typeof project.data === "object"
            );

            if (!validProjects.length) {
                throw new Error("Aucun projet valide");
            }

            const merged = [...existing];

            validProjects.forEach(project => {
                const index = merged.findIndex(item => item.id === project.id);

                if (index >= 0) {
                    merged[index] = project;
                } else {
                    merged.push(project);
                }
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

            renderSavedProjects();

            notify(`${validProjects.length} projet(s) importé(s).`);
        } catch {
            notify("Fichier JSON invalide ou impossible à importer.", "error");
        }

        $("#importerDonnees").value = "";
    };

    reader.onerror = () => {
        notify("Erreur pendant la lecture du fichier.", "error");
    };

    reader.readAsText(file);
}


/* =========================================
   20. NOUVEAU PROJET
========================================= */

function newProject() {
    const confirmed = window.confirm(
        "Créer un nouveau projet ? Les modifications non enregistrées seront perdues."
    );

    if (!confirmed) return;

    $$("input, select, textarea").forEach(element => {
        if (element.type === "file") return;

        if (element.type === "checkbox") {
            element.checked = element.defaultChecked;
        } else if (element.id === "devise") {
            element.value = "USD";
        } else if (element.id === "nombrepieces") {
            element.value = "1";
        } else if (element.id === "dateProjet") {
            element.value = new Date().toISOString().slice(0, 10);
        } else if (element.type === "number") {
            element.value = element.defaultValue;
        } else {
            element.value = element.defaultValue;
        }
    });

    createRooms();

    state.floor = null;
    state.skirting = null;
    state.wall = null;
    state.materials = {};
    state.quoteLines = [];
    state.transport = 0;
    state.labor = 0;
    state.subtotal = 0;
    state.margin = 0;
    state.total = 0;

    clearAllResults();
    updateMethodPanels();
    updateDimensionPanels();

    setHTML("zoneDevis", `
        <p class="muted">
            Le devis professionnel sera affiché ici après sa génération.
        </p>
    `);

    notify("Nouveau projet créé.");
}


/* =========================================
   21. AFFICHAGE DES OPTIONS DE POSE
========================================= */

function updateMethodPanels() {
    const methods = [
        {
            select: "methodePoseSol",
            mortar: "parametresMortierSol",
            adhesive: "parametresColleSol"
        },
        {
            select: "methodePosePlinthes",
            mortar: "parametresMortierPlinthes",
            adhesive: "parametresCollePlinthes"
        },
        {
            select: "methodePoseMurs",
            mortar: "parametresMortierMurs",
            adhesive: "parametresColleMurs"
        }
    ];

    methods.forEach(item => {
        const method = getValue(item.select, "traditional");

        const mortar = document.getElementById(item.mortar);
        const adhesive = document.getElementById(item.adhesive);

        if (mortar) {
            mortar.hidden = method !== "traditional";
        }

        if (adhesive) {
            adhesive.hidden = method !== "adhesive";
        }
    });
}

function updateDimensionPanels() {
    const dimensions = [
        ["utiliserDimensionsSol", "dimensionsSol"],
        ["utiliserDimensionsPlinthes", "dimensionsPlinthes"],
        ["utiliserDimensionsMurs", "dimensionsMurs"]
    ];

    dimensions.forEach(([checkboxId, panelId]) => {
        const checkbox = document.getElementById(checkboxId);
        const panel = document.getElementById(panelId);

        if (!checkbox || !panel) return;

        panel.style.opacity = checkbox.checked ? "1" : "0.55";
    });
}


/* =========================================
   22. MISE À JOUR DES INFORMATIONS
========================================= */

function clearAllResults() {
    [
        "resultatsurface",
        "resultatMortierSol",
        "resultatperimetre",
        "resultatplinthes",
        "resultatfaience"
    ].forEach(clearResult);

    const tbody = $("#tableauResultats");

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-cell">
                    Aucun calcul effectué pour le moment.
                </td>
            </tr>
        `;
    }

    setText(
        "resultStatus",
        "Les résultats apparaîtront ici après les calculs."
    );
}

function updateFooter() {
    setText("currentyear", new Date().getFullYear());

    const lastModified = document.lastModified;

    if (lastModified) {
        const date = new Date(lastModified);

        setText(
            "lastModified",
            Number.isNaN(date.getTime())
                ? "Date indisponible"
                : date.toLocaleDateString("fr-FR")
        );
    }

    if ($("#dateProjet") && !$("#dateProjet").value) {
        $("#dateProjet").value = new Date().toISOString().slice(0, 10);
    }
}


/* =========================================
   23. ÉVÉNEMENTS
========================================= */

function attachEvents() {

    $("#ajouterpieces")?.addEventListener("click", createRooms);

    /*
       Délégation d'événements :
       fonctionne aussi après le changement de forme géométrique.
    */

    $("#formulairespieces")?.addEventListener("change", event => {
        if (event.target.classList.contains("room-shape")) {
            const room = event.target.closest(".room-card");

            updateRoomDimensions(room, event.target.value);

            clearAllResults();
        }
    });

    $("#formulairespieces")?.addEventListener("input", event => {
        if (
            event.target.classList.contains("room-dimension") ||
            event.target.classList.contains("room-name")
        ) {
            state.floor = null;
            state.skirting = null;
        }
    });

    $("#formulairespieces")?.addEventListener("click", event => {
        const button = event.target.closest(".remove-room");

        if (!button) return;

        const rooms = $$(".room-card", $("#formulairespieces"));

        if (rooms.length <= 1) {
            notify("Il faut conserver au moins une pièce.", "error");
            return;
        }

        button.closest(".room-card").remove();

        $$(".room-card", $("#formulairespieces")).forEach((room, index) => {
            room.dataset.roomIndex = index;

            const heading = $("h3", room);

            if (heading) heading.textContent = `Pièce ${index + 1}`;
        });

        $("#nombrepieces").value =
            $$(".room-card", $("#formulairespieces")).length;

        clearAllResults();
    });

    $("#calculersurfaces")?.addEventListener("click", calculateFloor);

    $("#calculerMortierSol")?.addEventListener("click", () => {
        if (getSurfaceMethod("sol") === "adhesive") {
            notify(
                "Le sol utilise le ciment-colle. Le mortier traditionnel n'est pas calculé.",
                "error"
            );
            return;
        }

        calculateFloorMortar();
    });

    $("#calculerperimetre")?.addEventListener("click", calculatePerimeter);

    $("#calculerplinthes")?.addEventListener("click", calculateSkirting);

    $("#calculerfaience")?.addEventListener("click", calculateWall);

    [
        "methodePoseSol",
        "methodePosePlinthes",
        "methodePoseMurs"
    ].forEach(id => {
        document.getElementById(id)?.addEventListener(
            "change",
            updateMethodPanels
        );
    });

    [
        "utiliserDimensionsSol",
        "utiliserDimensionsPlinthes",
        "utiliserDimensionsMurs"
    ].forEach(id => {
        document.getElementById(id)?.addEventListener(
            "change",
            updateDimensionPanels
        );
    });

    $("#genererDevis")?.addEventListener("click", generateQuote);

    $("#imprimerDevis")?.addEventListener("click", printQuote);

    $("#enregistrerProjet")?.addEventListener("click", saveProject);

    $("#nouveauProjet")?.addEventListener("click", newProject);

    $("#exporterDonnees")?.addEventListener("click", exportProjects);

    $("#importerDonnees")?.addEventListener("change", event => {
        importProjects(event.target.files?.[0]);
    });

    $("#listeProjets")?.addEventListener("click", event => {
        const loadButton = event.target.closest(".load-project");
        const deleteButton = event.target.closest(".delete-project");

        if (loadButton) {
            loadProject(loadButton.dataset.id);
        }

        if (deleteButton) {
            const confirmed = window.confirm(
                "Voulez-vous vraiment supprimer ce projet ?"
            );

            if (confirmed) {
                deleteProject(deleteButton.dataset.id);
            }
        }
    });

    /*
       Les modifications des paramètres rendent les anciens
       résultats potentiellement obsolètes.
    */

    const calculationInputs = [
        "#configurationCarreaux input",
        "#configurationCarreaux select",
        "#sectionSols input",
        "#sectionSols select",
        "#poseSol input",
        "#poseSol select",
        "#sectionPlinthes input",
        "#sectionPlinthes select",
        "#posePlinthes input",
        "#posePlinthes select",
        "#sectionMurs input",
        "#sectionMurs select",
        "#poseMurs input",
        "#poseMurs select",
        "#sectionAccessoires input",
        "#sectionAccessoires select",
        "#sectionTransport input",
        "#sectionTransport select",
        "#sectionPrix input"
    ].join(",");

    $$(calculationInputs).forEach(input => {
        input.addEventListener("input", () => {
            setText(
                "resultStatus",
                "Certains paramètres ont été modifiés. Relancez les calculs pour actualiser les résultats."
            );
        });
    });
}


/* =========================================
   24. INITIALISATION
========================================= */

function initializeApp() {
    createRooms();

    attachEvents();

    updateMethodPanels();

    updateDimensionPanels();

    renderSavedProjects();

    updateFooter();

    clearAllResults();

    console.info("KIJ Carrelage Pro initialisé.");
}

document.addEventListener("DOMContentLoaded", initializeApp);