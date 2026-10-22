// Wait for the DOM to load completely
document.addEventListener("DOMContentLoaded", () => {

    // 1. dynaically display the current year for the copyright
    const currentYearSpan = document.getElementById("currentyear");
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 2. Display the date and the hour of the last modification of the document
    const lastModifiedParagraph = document.getElementById("lastModified");
    if (lastModifiedParagraph) {
        lastModifiedParagraph.textContent = `Last Modification: ${document.lastModified}`;
    }
});


document.getElementById("calculer").addEventListener("click", function () {

    // Recuperer les valeurs saisies

    const longueurPiece = Number(document.getElementById("longueurpiece").value);

    const largeurPiece = Number(document.getElementById("largeurpiece").value);

    const longueurCarreau = Number(document.getElementById("longueurcarreau").value);

    const largeurCarreau = Number(document.getElementById("largeurcarreau").value);

    const calculMortier = Number(document.getElementById("calculmortier").value);

    // Effectuer les calculs

    const surfacePiece = longueurPiece * largeurPiece

    const surfaceCarreau = (longueurCarreau / 100) * (largeurCarreau / 100)

    const nombreCarreaux = Math.ceil((surfacePiece / surfaceCarreau) * (125 / 100))

    const volumeMortier = surfacePiece * (calculMortier / 100)

    // Afficher les resultats

    document.getElementById("resultat").innerHTML = ` <strong>Résultat du Métré</strong><br>
    
    Surface De la pièce: ${surfacePiece.toFixed(2)} m2 <br>
    
    Surface d'un carreau: ${surfaceCarreau.toFixed(4)} m2
    <br>
    
    Nombre de Carreaux avec 25% de Sécurité: ${nombreCarreaux} Pièces<br>
    
    Volume Mortier: ${volumeMortier.toFixed(2)} m3`;

});

const buttonAjouter = document.getElementById("ajouterpieces");
buttonAjouter.addEventListener("click", function () {
    const nombrepieces = Number(document.getElementById("nombrepieces").value);

    const conteneur = document.getElementById("formulairespieces");

    //Effacer les anciens formulaires
    conteneur.innerHTML = "";

    //Créer un titre pour chaque pièce
    for (let i = 0; i < nombrepieces; i++) {
        const titre = document.createElement("h3");
        titre.textContent = `Pièce ${i + 1}`;
        conteneur.appendChild(titre);
    }
});