const menu = document.querySelector('#mobile-menu')
const menuLinks= document.querySelector('.navbar__menu')
const navLinks = document.querySelectorAll('[data-dialog]');
const mainContainer = document.querySelector('.main__container')
const hiddenLinks = document.querySelectorAll('.hidden-link');

const originalContent = mainContainer.innerHTML; //this is the OG home content captured

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active')
    menuLinks.classList.toggle('active');
})


