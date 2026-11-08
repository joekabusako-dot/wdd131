document.addEventListener("DOMContentLoaded", function () {
    // 1. Année et dernière modification
    document.getElementById("currentyear").textContent =
        new Date().getFullYear();

    document.getElementById("lastModified").textContent =
        "Dernière modification : " + document.lastModified;

    // 2. Éléments principaux
    const nombrePieces = document.getElementById("nombrepieces");
    const boutonAjouter = document.getElementById("ajouterpieces");
    const conteneur = document.getElementById("formulairespieces");

    // 3. Ajouter les pièces
    boutonAjouter.addEventListener("click", function () {
        const nombre = Number(nombrePieces.value);

        if (!Number.isInteger(nombre) || nombre < 1 || nombre > 100) {
            alert("Entrez un nombre entier de pièces compris entre 1 et 100.");
            return;
        }

        conteneur.innerHTML = "";
        document.getElementById("resultatsurface").textContent = "";
        document.getElementById("resultatsurface").dataset.surfaceAvecPertes = "";
        document.getElementById("resultatperimetre").textContent = "";
        document.getElementById("resultatplinthes").textContent = "";
        document.getElementById("resultatMortierSol").textContent = "";
        document.getElementById("etapehauteur").hidden = true;

        for (let i = 0; i < nombre; i++) {
            const bloc = document.createElement("div");
            bloc.className = "piece-form";

            const titre = document.createElement("h4");
            titre.textContent = `Pièce ${i + 1}`;

            const labelForme = document.createElement("label");
            labelForme.textContent = "Forme de la pièce : ";

            const choixForme = document.createElement("select");
            choixForme.className = "forme-piece";

            choixForme.innerHTML = `
                <option value="">Choisir une forme</option>
                <option value="rectangle">Rectangle</option>
                <option value="cercle">Cercle</option>
                <option value="trapeze">Trapèze</option>
                <option value="parallelogramme">Parallélogramme</option>
            `;

            const dimensions = document.createElement("div");
            dimensions.className = "dimensions";

            choixForme.addEventListener("change", function () {
                if (choixForme.value === "rectangle") {
                    dimensions.innerHTML = `
                        <label>Longueur (m) :</label>
                        <input type="number" class="longueur" min="0" step="any">
                        <br>
                        <label>Largeur (m) :</label>
                        <input type="number" class="largeur" min="0" step="any">
                    `;
                } else if (choixForme.value === "cercle") {
                    dimensions.innerHTML = `
                        <label>Diamètre (m) :</label>
                        <input type="number" class="diametre" min="0" step="any">
                    `;
                } else if (choixForme.value === "trapeze") {
                    dimensions.innerHTML = `
                        <label>Grande base (m) :</label>
                        <input type="number" class="grandebase" min="0" step="any">
                        <br>
                        <label>Petite base (m) :</label>
                        <input type="number" class="petitebase" min="0" step="any">
                        <br>
                        <label>Hauteur (m) :</label>
                        <input type="number" class="hauteur" min="0" step="any">
                        <br>
                        <label>Premier côté oblique (m) :</label>
                        <input type="number" class="cote1" min="0" step="any">
                        <br>
                        <label>Deuxième côté oblique (m) :</label>
                        <input type="number" class="cote2" min="0" step="any">
                    `;
                } else if (choixForme.value === "parallelogramme") {
                    dimensions.innerHTML = `
                        <label>Base (m) :</label>
                        <input type="number" class="base" min="0" step="any">
                        <br>
                        <label>Hauteur (m) :</label>
                        <input type="number" class="hauteurpara" min="0" step="any">
                        <br>
                        <label>Côté oblique (m) :</label>
                        <input type="number" class="cotepara" min="0" step="any">
                    `;
                } else {
                    dimensions.innerHTML = "";
                }

                document.getElementById("resultatsurface").textContent = "";
                document.getElementById("resultatsurface").dataset.surfaceAvecPertes = "";
                document.getElementById("resultatperimetre").textContent = "";
                document.getElementById("resultatplinthes").textContent = "";
                document.getElementById("resultatMortierSol").textContent = "";
                document.getElementById("etapehauteur").hidden = true;
            });

            bloc.append(titre, labelForme, choixForme, dimensions);
            conteneur.appendChild(bloc);
        }
    });

    // 4. Fonctions de lecture et de validation des dimensions
    function lireValeur(dimensions, classe) {
        const champ = dimensions.querySelector("." + classe);

        if (!champ || champ.value.trim() === "") {
            return NaN;
        }

        return Number(champ.value);
    }

    function dimensionsValides(dimensions, classes) {
        return classes.every(function (classe) {
            const valeur = lireValeur(dimensions, classe);
            return Number.isFinite(valeur) && valeur > 0;
        });
    }

    // 5. Calcul des surfaces
    document.getElementById("calculersurfaces").addEventListener("click", function () {
        const pieces = conteneur.querySelectorAll(".piece-form");
        const resultat = document.getElementById("resultatsurface");

        resultat.dataset.surfaceAvecPertes = "";
        document.getElementById("resultatMortierSol").textContent = "";

        if (pieces.length === 0) {
            resultat.textContent = "Veuillez d'abord ajouter les pièces.";
            return;
        }

        let surfaceTotale = 0;

        for (const piece of pieces) {
            const forme = piece.querySelector(".forme-piece").value;
            const dimensions = piece.querySelector(".dimensions");
            let surface = 0;
            let champs = [];

            if (forme === "rectangle") {
                champs = ["longueur", "largeur"];
            } else if (forme === "cercle") {
                champs = ["diametre"];
            } else if (forme === "trapeze") {
                champs = ["grandebase", "petitebase", "hauteur", "cote1", "cote2"];
            } else if (forme === "parallelogramme") {
                champs = ["base", "hauteurpara", "cotepara"];
            } else {
                resultat.textContent = "Veuillez choisir la forme de chaque pièce.";
                return;
            }

            if (!dimensionsValides(dimensions, champs)) {
                resultat.textContent =
                    "Veuillez renseigner toutes les dimensions requises avec des valeurs supérieures à zéro.";
                return;
            }

            if (forme === "rectangle") {
                surface =
                    lireValeur(dimensions, "longueur") *
                    lireValeur(dimensions, "largeur");
            } else if (forme === "cercle") {
                const rayon = lireValeur(dimensions, "diametre") / 2;
                surface = Math.PI * rayon ** 2;
            } else if (forme === "trapeze") {
                surface =
                    (lireValeur(dimensions, "grandebase") +
                        lireValeur(dimensions, "petitebase")) *
                    lireValeur(dimensions, "hauteur") / 2;
            } else if (forme === "parallelogramme") {
                surface =
                    lireValeur(dimensions, "base") *
                    lireValeur(dimensions, "hauteurpara");
            }

            surfaceTotale += surface;
        }

        const tauxPertes = Number(document.getElementById("tauxpertes").value);
        const quantite = surfaceTotale * (1 + tauxPertes / 100);

        // Sauvegarder la surface avec pertes pour le calcul du mortier
        resultat.dataset.surfaceAvecPertes = quantite;

        resultat.textContent =
            `Surface totale : ${Math.ceil(surfaceTotale)} m². ` +
            `Taux de pertes : ${tauxPertes} %. ` +
            `Quantité de carreaux à prévoir : ${Math.ceil(quantite)} m².`;
    });

    // 6. Calcul du mortier de pose du carrelage au sol
    document.getElementById("calculerMortierSol").addEventListener("click", function () {
        const surfaceAvecPertes = Number(
            document.getElementById("resultatsurface")
                .dataset.surfaceAvecPertes
        );

        const epaisseurCm = Number(
            document.getElementById("epaisseurMortierSol").value
        );

        const resultat = document.getElementById("resultatMortierSol");

        if (
            !Number.isFinite(surfaceAvecPertes) ||
            surfaceAvecPertes <= 0 ||
            !Number.isFinite(epaisseurCm) ||
            epaisseurCm <= 0 ||
            epaisseurCm > 10
        ) {
            resultat.textContent =
                "Calcule d'abord les carreaux et vérifie l'épaisseur de pose.";
            return;
        }

        const epaisseurMetres = epaisseurCm / 100;

        // Volume théorique de mortier humide
        const volumeTheorique = surfaceAvecPertes * epaisseurMetres;

        // Marge de sécurité de 20 %
        const volumeMortier = volumeTheorique * 1.20;

        // Estimation du volume sec pour le dosage 1:4
        const volumeSec = volumeMortier * 1.33;
        const volumeCiment = volumeSec / 5;
        const volumeSable = volumeSec * 4 / 5;

        // Sac de 50 kg ≈ 0,035 m³ ; sable ≈ 1,6 tonne/m³
        const sacsCiment = Math.ceil(volumeCiment / 0.035);
        const tonnesSable = volumeSable * 1.6;

        resultat.innerHTML = `
            <h3>Résultats du mortier de pose</h3>
            <p>Surface de calcul : ${surfaceAvecPertes.toFixed(2)} m²</p>
            <p>Épaisseur : ${epaisseurCm.toFixed(1)} cm</p>
            <p>Volume théorique : ${volumeTheorique.toFixed(3)} m³</p>
            <p>Volume avec 20 % de sécurité :
                <strong>${volumeMortier.toFixed(3)} m³</strong>
            </p>
            <p>Ciment (sacs de 50 kg) :
                <strong>${sacsCiment} sacs</strong>
            </p>
            <p>Sable :
                <strong>${tonnesSable.toFixed(2)} tonnes</strong>
            </p>
            <p><em>Estimation indicative pour un mortier traditionnel
            dosé à 1:4 en volume. À adapter au support et au dosage réel.</em></p>
        `;
    });

    // 7. Étape 1 des plinthes : calcul automatique du périmètre total
    document.getElementById("calculerperimetre").addEventListener("click", function () {
        const pieces = conteneur.querySelectorAll(".piece-form");
        const resultatPerimetre = document.getElementById("resultatperimetre");
        const etapeHauteur = document.getElementById("etapehauteur");

        etapeHauteur.hidden = true;
        document.getElementById("resultatplinthes").textContent = "";

        if (pieces.length === 0) {
            resultatPerimetre.textContent =
                "Veuillez d'abord ajouter les pièces et renseigner leurs dimensions.";
            return;
        }

        let perimetreTotal = 0;

        for (const piece of pieces) {
            const forme = piece.querySelector(".forme-piece").value;
            const dimensions = piece.querySelector(".dimensions");
            let champs = [];
            let perimetre = 0;

            if (forme === "rectangle") {
                champs = ["longueur", "largeur"];
            } else if (forme === "cercle") {
                champs = ["diametre"];
            } else if (forme === "trapeze") {
                champs = ["grandebase", "petitebase", "hauteur", "cote1", "cote2"];
            } else if (forme === "parallelogramme") {
                champs = ["base", "hauteurpara", "cotepara"];
            } else {
                resultatPerimetre.textContent =
                    "Veuillez choisir la forme de chaque pièce.";
                return;
            }

            if (!dimensionsValides(dimensions, champs)) {
                resultatPerimetre.textContent =
                    "Veuillez compléter toutes les dimensions des pièces avant de calculer le périmètre.";
                return;
            }

            if (forme === "rectangle") {
                perimetre = 2 * (
                    lireValeur(dimensions, "longueur") +
                    lireValeur(dimensions, "largeur")
                );
            } else if (forme === "cercle") {
                perimetre = Math.PI * lireValeur(dimensions, "diametre");
            } else if (forme === "trapeze") {
                perimetre =
                    lireValeur(dimensions, "grandebase") +
                    lireValeur(dimensions, "petitebase") +
                    lireValeur(dimensions, "cote1") +
                    lireValeur(dimensions, "cote2");
            } else if (forme === "parallelogramme") {
                perimetre = 2 * (
                    lireValeur(dimensions, "base") +
                    lireValeur(dimensions, "cotepara")
                );
            }

            perimetreTotal += perimetre;
        }

        conteneur.dataset.perimetreTotal = perimetreTotal;

        resultatPerimetre.textContent =
            `Périmètre total des pièces : ${perimetreTotal.toFixed(2)} m.`;

        etapeHauteur.hidden = false;
        document.getElementById("hauteurplinthe").focus();
    });

    // 8. Étape 2 des plinthes : calcul de la surface et des pertes
    document.getElementById("calculerplinthes").addEventListener("click", function () {
        const hauteurChamp = document.getElementById("hauteurplinthe");
        const resultat = document.getElementById("resultatplinthes");
        const perimetre = Number(conteneur.dataset.perimetreTotal);

        if (!Number.isFinite(perimetre) || perimetre <= 0) {
            resultat.textContent =
                "Veuillez d'abord calculer le périmètre total.";
            return;
        }

        if (hauteurChamp.value.trim() === "") {
            resultat.textContent =
                "Veuillez entrer la hauteur des plinthes en mètres.";
            hauteurChamp.focus();
            return;
        }

        const hauteur = Number(hauteurChamp.value);

        if (!Number.isFinite(hauteur) || hauteur <= 0) {
            resultat.textContent =
                "La hauteur des plinthes doit être supérieure à zéro.";
            hauteurChamp.focus();
            return;
        }

        const tauxPertes = Number(document.getElementById("tauxpertes").value);
        const surface = perimetre * hauteur;
        const quantiteAvecPertes = surface * (1 + tauxPertes / 100);

        resultat.textContent =
            `Périmètre total : ${Math.ceil(perimetre)} m. ` +
            `Surface des plinthes : ${Math.ceil(surface)} m². ` +
            `Avec ${tauxPertes} % de pertes : ${Math.ceil(quantiteAvecPertes)} m² de carreaux.`;
    });

    // 9. Calcul des faïences et du mortier de plaquage
    const boutonFaience = document.getElementById("calculerfaience");

    boutonFaience.addEventListener("click", function () {
        const longueur = Number(
            document.getElementById("longueurpiece").value
        );

        const hauteur = Number(
            document.getElementById("largeurpiece").value
        );

        const epaisseurCm = Number(
            document.getElementById("epaisseurpose").value
        );

        const resultat = document.getElementById("resultatfaience");

        if (
            !Number.isFinite(longueur) ||
            !Number.isFinite(hauteur) ||
            !Number.isFinite(epaisseurCm) ||
            longueur <= 0 ||
            hauteur <= 0 ||
            epaisseurCm <= 0 ||
            epaisseurCm > 10
        ) {
            resultat.textContent =
                "Veuillez saisir des valeurs valides. " +
                "L'épaisseur doit être comprise entre 0,1 et 10 cm.";
            return;
        }

        // 1. Surface de faïence
        const surfaceNette = longueur * hauteur;

        // 10 % de pertes pour les découpes et les casses
        const surfaceAvecPertes = surfaceNette * 1.10;

        // 2. Volume de mortier humide avec 20 % de sécurité
        const epaisseurMetres = epaisseurCm / 100;
        const volumeTheorique = surfaceNette * epaisseurMetres;
        const volumeMortier = volumeTheorique * 1.20;

        // 3. Estimation du ciment et du sable
        const volumeSec = volumeMortier * 1.33;
        const volumeCiment = volumeSec / 5;
        const volumeSable = volumeSec * 4 / 5;

        const nombreSacs = Math.ceil(volumeCiment / 0.035);
        const tonnesSable = volumeSable * 1.6;

        resultat.innerHTML = `
            <h3>Résultats du métré</h3>
            <h4>Faïence</h4>
            <p>Surface nette : ${surfaceNette.toFixed(2)} m²</p>
            <p>Avec 10 % de pertes :
                <strong>${surfaceAvecPertes.toFixed(2)} m²</strong>
            </p>

            <h4>Mortier traditionnel ciment-sable</h4>
            <p>Volume théorique sans marge :
                ${volumeTheorique.toFixed(3)} m³
            </p>
            <p>Volume avec 20 % de sécurité :
                <strong>${volumeMortier.toFixed(3)} m³</strong>
            </p>

            <h4>Matériaux estimatifs</h4>
            <p>Dosage supposé : 1 volume de ciment pour 4 volumes de sable.</p>
            <p>Sacs de ciment de 50 kg :
                <strong>${nombreSacs} sacs</strong>
            </p>
            <p>Sable :
                <strong>${tonnesSable.toFixed(2)} tonnes</strong>
            </p>

            <p><em>Estimation indicative à confirmer selon la méthode
            de pose, la planéité du support et le dosage réel.</em></p>
        `;
    });
});