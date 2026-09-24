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



const temples = [
    {
        templeName: "Aba Nigeria",
        location: "Aba, Nigeria",
        year: 2005,
        dedicated: "2005, August, 7",
        area: 11500,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/aba-nigeria/400x250/aba-nigeria-temple-lds-273999-wallpaper.jpg"
    },
    {
        templeName: "Manti Utah",
        location: "Manti, Utah, United States",
        year: 1888,
        dedicated: "1888, May, 21",
        area: 74792,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/manti-utah/400x250/manti-temple-768192-wallpaper.jpg"
    },
    {
        templeName: "Payson Utah",
        location: "Payson, Utah, United States",
        year: 2015,
        dedicated: "2015, June, 7",
        area: 96630,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/payson-utah/400x225/payson-utah-temple-exterior-1416671-wallpaper.jpg"
    },
    {
        templeName: "Yigo Guam",
        location: "Yigo, Guam",
        year: 2020,
        dedicated: "2020, May, 2",
        area: 6861,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/yigo-guam/400x250/yigo_guam_temple_2.jpg"
    },
    {
        templeName: "Washington D.C.",
        location: "Kensington, Maryland, United States",
        year: 1974,
        dedicated: "1974, November, 19",
        area: 156558,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/washington-dc/400x250/washington_dc_temple-exterior-2.jpeg"
    },
    {
        templeName: "Lima Perú",
        location: "Lima, Perú",
        year: 1986,
        dedicated: "1986, January, 10",
        area: 9600,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/lima-peru/400x250/lima-peru-temple-evening-1075606-wallpaper.jpg"
    },
    {
        templeName: "Mexico City Mexico",
        location: "Mexico City, Mexico",
        year: 1983,
        dedicated: "1983, December, 2",
        area: 116642,
        imageUrl:
            "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/mexico-city-mexico/400x250/mexico-city-temple-exterior-1518361-wallpaper.jpg"
    },
    // Add more temple objects here...

    {
        templeName: "Kinshasa",
        location: "Kinshasa, DR Congo",
        year: 2019,
        dedicated: "2019, April, 14",
        area: 12000,
        imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/kinshasa-democratic-republic-of-the-congo-temple/kinshasa-democratic-republic-of-the-congo-temple-3533-main.jpg"
    },

    {
        templeName: "Accra",
        location: "Accra, Ghana",
        year: 2004,
        dedicated: "2004, January, 11",
        area: 17500,
        imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/accra-ghana-temple/accra-ghana-temple-13760-main.jpg"


    },
    {
        templeName: "Johannesburg",
        location: "Johannesburg, South Africa",
        year: 1985,
        dedicated: "1985, August, 24",
        area: 19184,
        imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/johannesburg-south-africa-temple/johannesburg-south-africa-temple-22475-main.jpg"
    }
];



const templeList = document.querySelector("#temple-list");



function displayTemples(templesToDisplay) {
    templeList.innerHTML = "";

    templesToDisplay.forEach((temple) => {
        templeList.innerHTML += `
            <article>
                <img 
                    src="${temple.imageUrl}"
                    alt="${temple.templeName}"
                    loading="lazy"
                >
                <h2>${temple.templeName}</h2>
                <p>${temple.location}</p>
                <p>Dedicated: ${temple.dedicated}</p>
                <p>Area: ${temple.area} sq ft</p>
            </article>
        `;
    });
}

displayTemples(temples)


document.querySelector("#home").addEventListener("click", () => {
    displayTemples(temples);
});

document.querySelector("#old").addEventListener("click", () => {
    displayTemples(
        temples.filter((temple) => temple.year < 1900)
    );
});

document.querySelector("#new").addEventListener("click", () => {
    displayTemples(
        temples.filter((temple) => temple.year > 2000)
    );
});

document.querySelector("#large").addEventListener("click", () => {
    displayTemples(
        temples.filter((temple) => temple.area > 90000)
    );
});

document.querySelector("#small").addEventListener("click", () => {
    displayTemples(
        temples.filter((temple) => temple.area < 10000)
    );
});

