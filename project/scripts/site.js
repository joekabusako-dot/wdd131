// Wait until the HTML document is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. FOOTER: CURRENT YEAR AND LAST MODIFICATION
    // ==========================================

    const currentYearSpan = document.querySelector("#currentyear");
    const lastModifiedParagraph = document.querySelector("#lastModified");

    if (currentYearSpan) {
        currentYearSpan.textContent = `${new Date().getFullYear()}`;
    }

    if (lastModifiedParagraph) {
        lastModifiedParagraph.textContent =
            `Last Modification: ${document.lastModified}`;
    }


    // ==========================================
    // 2. HAMBURGER MENU
    // ==========================================

    const hamburgerButton = document.querySelector("#hamburger-btn");
    const navigation = document.querySelector(".navigation");

    if (hamburgerButton && navigation) {

        hamburgerButton.setAttribute("aria-expanded", "false");

        hamburgerButton.addEventListener("click", () => {

            const isOpen = navigation.classList.toggle("show");

            hamburgerButton.classList.toggle("show", isOpen);

            hamburgerButton.setAttribute("aria-expanded", `${isOpen}`);

            hamburgerButton.setAttribute(
                "aria-label",
                `${isOpen ? "Close the Menu" : "Open the Menu"}`
            );

        });

    }


    // ==========================================
    // 3. REQUEST A RIDE FORM
    // ==========================================

    const requestForm = document.querySelector("#request-form");
    const requestFeedback = document.querySelector("#request-feedback");
    const requestCount = document.querySelector("#request-count");
    const requestList = document.querySelector("#request-list");

    let rideRequests = [];

    try {
        rideRequests = JSON.parse(
            localStorage.getItem("kijRideRequests") || "[]"
        );

        if (!Array.isArray(rideRequests)) {
            rideRequests = [];
        }
    } catch (error) {
        rideRequests = [];
    }


    // Display saved ride requests
    function displayRideRequests() {

        if (!requestList || !requestCount) {
            return;
        }

        requestList.replaceChildren();

        rideRequests.forEach((request) => {

            const listItem = document.createElement("li");

            listItem.textContent =
                `${request.name} — ${request.pickup} to ${request.destination} — ${request.date} at ${request.time}`;

            requestList.appendChild(listItem);

        });

        requestCount.textContent =
            `Total saved ride requests: ${rideRequests.length}`;

    }


    // Handle ride request submission
    function saveRideRequest(event) {

        event.preventDefault();

        const name = document.querySelector("#name").value.trim();
        const number = document.querySelector("#number").value.trim();
        const pickup = document.querySelector("#pickup").value.trim();
        const destination = document.querySelector("#destination").value.trim();
        const date = document.querySelector("#date").value;
        const time = document.querySelector("#time").value;

        // Check required fields
        if (!name || !number || !pickup || !destination || !date || !time) {

            requestFeedback.textContent =
                "Please complete all required fields.";

            return;
        }


        // Pickup and destination must be different
        if (pickup.toLowerCase() === destination.toLowerCase()) {

            requestFeedback.textContent =
                "Pickup and destination must be different.";

            return;
        }


        // Do not accept a date in the past
        const selectedDate = new Date(`${date}T00:00:00`);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {

            requestFeedback.textContent =
                "Please choose today or a future date.";

            return;
        }


        // Create a ride request object
        const rideRequest = {
            name: name,
            number: number,
            pickup: pickup,
            destination: destination,
            date: date,
            time: time
        };


        // Save the request
        rideRequests.push(rideRequest);

        try {

            localStorage.setItem(
                "kijRideRequests",
                JSON.stringify(rideRequests)
            );

        } catch (error) {

            rideRequests.pop();

            requestFeedback.textContent =
                "Unable to save your request in this browser.";

            return;
        }


        // Show confirmation
        requestFeedback.textContent =
            `Thank you, ${name}! Your ride request has been saved on this device.`;

        requestForm.reset();

        displayRideRequests();

    }


    if (requestForm) {

        requestForm.addEventListener("submit", saveRideRequest);

        displayRideRequests();

    }



    // ==========================================
    // 4. CONTACT US FORM
    // ==========================================

    const contactForm = document.querySelector("#contact-form");
    const contactFeedback = document.querySelector("#contact-feedback");
    const messageCount = document.querySelector("#message-count");
    const messageList = document.querySelector("#message-list");

    let contactMessages = [];

    try {

        contactMessages = JSON.parse(
            localStorage.getItem("kijContactMessages") || "[]"
        );

        if (!Array.isArray(contactMessages)) {
            contactMessages = [];
        }

    } catch (error) {

        contactMessages = [];

    }


    // Display saved contact messages
    function displayContactMessages() {

        if (!messageList || !messageCount) {
            return;
        }

        messageList.replaceChildren();

        contactMessages.forEach((message) => {

            const listItem = document.createElement("li");

            listItem.textContent =
                `${message.name} — ${message.subject}: ${message.message}`;

            messageList.appendChild(listItem);

        });

        messageCount.textContent =
            `Total saved messages: ${contactMessages.length}`;

    }


    // Handle contact form submission
    function saveContactMessage(event) {

        event.preventDefault();

        const name = document.querySelector("#name").value.trim();
        const email = document.querySelector("#email").value.trim();
        const subject = document.querySelector("#subject").value.trim();
        const message = document.querySelector("#message").value.trim();


        // Check required fields
        if (!name || !email || !subject || !message) {

            contactFeedback.textContent =
                "Please complete all required fields.";

            return;
        }


        // Create a contact message object
        const contactMessage = {
            name: name,
            email: email,
            subject: subject,
            message: message,
            date: new Date().toLocaleDateString()
        };


        // Save the message
        contactMessages.push(contactMessage);

        try {

            localStorage.setItem(
                "kijContactMessages",
                JSON.stringify(contactMessages)
            );

        } catch (error) {

            contactMessages.pop();

            contactFeedback.textContent =
                "Unable to save your message in this browser.";

            return;
        }


        // Show confirmation
        contactFeedback.textContent =
            `Thank you, ${name}! Your message has been saved on this device.`;

        contactForm.reset();

        displayContactMessages();

    }


    if (contactForm) {

        contactForm.addEventListener("submit", saveContactMessage);

        displayContactMessages();

    }

});