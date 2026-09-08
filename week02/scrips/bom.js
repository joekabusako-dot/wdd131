// select elements from the DOM
const input = document.querySelector('#favchap');
const button = document.querySelector('button');
const list = document.querySelector('#list');

//Wait for button clicks
button.addEventListener('click', function () {
    //check if the user has entered a value
    if (input.value.trim() !== '') {
        //create list item and give it the value of the input 
        const li = document.createElement('li');
        li.textContent = input.value;
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