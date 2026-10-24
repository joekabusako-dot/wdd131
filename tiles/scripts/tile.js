// Wait for the DOM to load completely
document.addEventListener("DOMContentLoaded", () => {

    // 1. Display the current year for the copyright
    const currentYearSpan = document.getElementById("currentyear");

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 2. Display the date and time of the last modification
    const lastModifiedParagraph = document.getElementById("lastModified");

    if (lastModifiedParagraph) {
        lastModifiedParagraph.textContent = `Last Modification: ${document.lastModified}`;
    }


    // 3. Calculate tiles and mortar
    document.getElementById("calculer").addEventListener("click", function () {

        // Retrieve entered values
        const longueurPiece = Number(document.getElementById("longueurpiece").value);
        const largeurPiece = Number(document.getElementById("largeurpiece").value);
        const longueurCarreau = Number(document.getElementById("longueurcarreau").value);
        const largeurCarreau = Number(document.getElementById("largeurcarreau").value);
        const calculMortier = Number(document.getElementById("calculmortier").value);

        // Perform calculations
        const surfacePiece = longueurPiece * largeurPiece;
        const surfaceCarreau = (longueurCarreau / 100) * (largeurCarreau / 100);
        const nombreCarreaux = Math.ceil((surfacePiece / surfaceCarreau) * (125 / 100));
        const volumeMortier = surfacePiece * (calculMortier / 100);

        // Display results
        document.getElementById("resultat").innerHTML = `
            <strong>Résultat du Métré</strong><br>
            Surface de la pièce : ${surfacePiece.toFixed(2)} m²<br>
            Surface d'un carreau : ${surfaceCarreau.toFixed(4)} m²<br>
            Nombre de carreaux avec 25 % de sécurité : ${nombreCarreaux} pièces<br>
            Volume de mortier : ${volumeMortier.toFixed(2)} m³
        `;
    });


    // 4. Create dynamic room forms
    const buttonAjouter = document.getElementById("ajouterpieces");

    buttonAjouter.addEventListener("click", function () {

        const nombrepieces = Number(document.getElementById("nombrepieces").value);
        const conteneur = document.getElementById("formulairespieces");

        // Clear previous forms
        conteneur.innerHTML = "";

        // Create a form for each room
        for (let i = 0; i < nombrepieces; i++) {

            const titre = document.createElement("h3");
            titre.textContent = `Pièce ${i + 1}`;

            // Create a dropdown to select the geometric shape
            const choixForme = document.createElement("select");

            choixForme.innerHTML = `
                <option value="">Choisir une forme</option>
                <option value="rectangle">Rectangle</option>
                <option value="cercle">Cercle</option>
                <option value="trapeze">Trapèze</option>
                <option value="parallelogramme">Parallélogramme</option>
            `;

            // Create the dimensions container
            const dimensions = document.createElement("div");
            dimensions.className = "dimensions";

            // Display the appropriate inputs for the selected shape
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
                    `;

                } else if (choixForme.value === "parallelogramme") {

                    dimensions.innerHTML = `
                        <label>Base (m) :</label>
                        <input type="number" class="base" min="0" step="any">
                        <br>
                        <label>Hauteur (m) :</label>
                        <input type="number" class="hauteurpara" min="0" step="any">
                    `;

                } else {

                    dimensions.innerHTML = "";
                }
            });

            conteneur.appendChild(titre);
            conteneur.appendChild(choixForme);
            conteneur.appendChild(dimensions);
        }
    });


    // 5. Calculate the total area of all rooms
    document.getElementById("calculersurfaces").addEventListener("click", function () {

        const toutesLesDimensions = document.querySelectorAll(".dimensions");

        let surfaceTotale = 0;

        toutesLesDimensions.forEach((dimensions) => {

            const choixForme = dimensions.previousElementSibling;
            let surface = 0;

            if (choixForme.value === "rectangle") {

                const longueur = Number(dimensions.querySelector(".longueur").value);
                const largeur = Number(dimensions.querySelector(".largeur").value);

                surface = longueur * largeur;

            } else if (choixForme.value === "cercle") {

                const diametre = Number(dimensions.querySelector(".diametre").value);

                surface = Math.PI * (diametre / 2) ** 2;

            } else if (choixForme.value === "trapeze") {

                const grandeBase = Number(dimensions.querySelector(".grandebase").value);
                const petiteBase = Number(dimensions.querySelector(".petitebase").value);
                const hauteurTrapeze = Number(dimensions.querySelector(".hauteur").value);

                surface = ((grandeBase + petiteBase) * hauteurTrapeze) / 2;

            } else if (choixForme.value === "parallelogramme") {

                const base = Number(dimensions.querySelector(".base").value);
                const hauteurPara = Number(dimensions.querySelector(".hauteurpara").value);

                surface = base * hauteurPara;
            }

            surfaceTotale += surface;
        });

        // Display the total area
        document.getElementById("resultatsurface").textContent =
            `Surface totale : ${surfaceTotale.toFixed(2)} m²`;
    });

});