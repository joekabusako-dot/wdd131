// Attendre que le DOM soit complètement chargé
document.addEventListener("DOMContentLoaded", () => {

    // 1. Sortir l'année actuelle dynamiquement pour le copyright
    const currentYearSpan = document.getElementById("currentyear");
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 2. Sortir la date et l'heure de dernière modification du document
    const lastModifiedParagraph = document.getElementById("lastModified");
    if (lastModifiedParagraph) {
        lastModifiedParagraph.textContent = `Last Modification: ${document.lastModified}`;
    }
});