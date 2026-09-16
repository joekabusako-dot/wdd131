//Wait for the page to be completely loaded
window.addEventListener("DOMContentLoaded", () => {

    //a. Define static variables (from my html)
    const currentTemp = 27; //In ℃ (must be <=10 for the calculation)
    const currentWindspeed = 8; //In ℃(must be > 4.8 for the calculation)

    //b. Selection of the HTML element where I will put the result
    const windChildElement = document.querySelector("#weather-chill");

    //c. Verification of viability conditions before launching the calculation
    //Temperature must be <= 10℃ and wind speed > 4.8 km/h
    if (currentTemp <= 10 && currentWindspeed > 4.8) {


        //if conditions are true, we call the functon and display result rounded
        const result = calculateWindchill(currentTemp, currentWindspeed);
        if (windChildElement) {
            windChildElement.textContent = `${Math.round(result)} ℃`;
        }

    } else {// when conditions are not met, display "N/A" 

        if (windChildElement) { windChildElement.textContent = "N/A"; }

    }

    /**
 * Calculates the wind chill factor using the Metric system.
 * Requirement: One line of code for the calculation and return statement.
 * 
 * @param {number} temp - Temperature in °C
 * @param {number} speed - Wind speed in km/h
 * @returns {number} - Wind chill index
 */
    function calculateWindChill(temp, speed) {
        return 13.12 + (0.6215 * temp) - (11.37 * Math.pow(speed, 0.16)) + (0.3965 * temp * Math.pow(speed, 0.16));
    }




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