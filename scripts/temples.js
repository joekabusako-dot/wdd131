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

// Create  variables to store the elements I will use.
const headnav = document.querySelector('.navigation')
const hambbtn = document.querySelector('#hamburger-btn')



hambbtn.addEventListener('click', () => {

    headnav.classList.toggle('show');
    hambbtn.classList.toggle('show');
});