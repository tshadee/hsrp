const menu = document.querySelector('#mobile-menu')
const menuLinks= document.querySelector('.navbar__menu')
// const hiddenLink = document.querySelector('.hidden-link')

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active')
    menuLinks.classList.toggle('active');
})

// function scaleTitleToFit(){
//     const title = document.getElementById('title-header');
//     const wrapper = title.parentElement;
//     title.style.transform = 'scale(1)';
//     const wrapperWidth = wrapper.offsetWidth;
//     const textWidth = title.scrollWidth;

//     if(textWidth > wrapperWidth)
//     {
//         const scaleFactor = wrapperWidth/textWidth;
//         title.style.transform = 'scale(${scaleFactor})';
//     }
// }

// window.addEventListener('resize', scaleTitleToFit);
// window.addEventListener('DOMContentLoaded', scaleTitleToFit);

// hiddenLink.addEventListener('mouseover', function() {
//     hiddenLink.classList.add(visible);
// })

// hiddenLink.addEventListener('mouseout', ()=> {
//     setTimeout(() => {
//         hiddenLink.classList.remove(visible);
//     }, 500);
// })