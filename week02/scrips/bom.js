// Create an array of the books of the Book of Mormon
const bookofMormon = ['1nephi', '2nephi', 'jacob', 'enos', 'jarom', 'omni', 'wmosiah', 'mosiah', 'alma', 'helaman', '3nephi', '4nephi', 'mormon', 'ether', 'moroni'];



// select elements from the DOM
const input = document.querySelector('#favchap');
const button = document.querySelector('button');
const list = document.querySelector('#list');

//Wait for button clicks
button.addEventListener('click', function () {
    //check if the user has entered a value
    if (input.value.trim() !== '') {

        const cleanedValue = input.value.trim();

        // 1. check if the book is valid
        const isBookValid = bookofMormon.some(book =>
            cleanedValue.toLowerCase().replace(/ /g, '').startsWith(book)
        );
        if (!isBookValid) {
            alert("This book is not part of the Book of Mormon.");
            return;
        }

        // 2. Limit the number of items in the list to 10
        if (list.children.length >= 10) {
            alert("Limit reached : maximum 10 elements.");
            return;
        }

        // 3. avoid duplicates in the list
        const currentItems = Array.from(list.querySelectorAll('li')).map(item =>
            item.textContent.replace('❌', '').trim()
        );
        if (currentItems.includes(cleanedValue)) {
            alert("This chapter is already in the list.");
            return;
        }
        //create list item and give it the value of the input 
        const li = document.createElement('li');
        li.textContent = cleanedValue;
        //create a button and add  a click event listener  
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '❌';
        deleteButton.addEventListener('click', function () {
            list.removeChild(li);
            input.focus()
        });
        //add the button to the list item        
        li.appendChild(deleteButton);
        //finally display the completed list item to unordered list
        list.appendChild(li);
        //clear the user input field
        input.value = '';
        //set focus back to the input field
        input.focus();
    }
});