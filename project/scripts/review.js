// Get the current number of reviews
let reviewCount = Number(localStorage.getItem("reviewCount")) || 0;

// Increment by 1
reviewCount++;

// Save the new value
localStorage.setItem("reviewCount", reviewCount);

// Display the count
const reviewCountElement = document.getElementById("reviewCount");

if (reviewCountElement) {
    reviewCountElement.textContent = reviewCount;
}