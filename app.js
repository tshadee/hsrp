const menu = document.querySelector('#mobile-menu')
const menuLinks= document.querySelector('.navbar__menu')
// const hiddenLink = document.querySelector('.hidden-link')

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active')
    menuLinks.classList.toggle('active');
})

// hiddenLink.addEventListener('mouseover', function() {
//     hiddenLink.classList.add(visible);
// })

// hiddenLink.addEventListener('mouseout', ()=> {
//     setTimeout(() => {
//         hiddenLink.classList.remove(visible);
//     }, 500);
// })