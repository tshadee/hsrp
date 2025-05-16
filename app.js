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

//this stores all the content (and also the capture of the home page)
const contentPages = {
    'home': originalContent,
    'projects': `
        <div class="section__content">
            <h1>My Projects</h1>
            <div class="content-section">
                <h2>Project 1</h2>
                <p>Description of my first project goes here. This could be a detailed explanation of what the project does, technologies used, and the problem it solves.</p>
            </div>
            <div class="content-section">
                <h2>Project 2</h2>
                <p>Description of my second project goes here. Include any interesting challenges and how you overcame them.</p>
            </div>
            <div class="content-section">
                <h2>Project 3</h2>
                <p>Details about another cool project you've worked on. Maybe even include links or screenshots.</p>
            </div>
        </div>
    `,
    'timeline': `
        <div class="section__content">
            <h1>My Timeline</h1>
            <div class="content-section">
                <h2>2025</h2>
                <p>Current activities and accomplishments. What are you working on right now?</p>
                <ul>
                    <li>Created personal website</li>
                    <li>Learned new web development skills</li>
                    <li>Started new exciting projects</li>
                </ul>
            </div>
            <div class="content-section">
                <h2>2024</h2>
                <p>Previous year's highlights and milestones. What were some significant achievements?</p>
                <ul>
                    <li>Completed major project</li>
                    <li>Reached important personal goal</li>
                    <li>Learned fundamental programming concepts</li>
                </ul>
            </div>
        </div>
    `,
    'resume': `
        <div class="section__content">
            <h1>My Resume</h1>
            <div class="content-section">
                <h2>Experience</h2>
                <div class="resume-item">
                    <h3>Position Title</h3>
                    <p class="resume-date">2023 - Present</p>
                    <p>Description of responsibilities and achievements in this role.</p>
                </div>
                <div class="resume-item">
                    <h3>Previous Position</h3>
                    <p class="resume-date">2021 - 2023</p>
                    <p>Details about previous work experience and key accomplishments.</p>
                </div>
            </div>
            <div class="content-section">
                <h2>Education</h2>
                <div class="resume-item">
                    <h3>Degree Name</h3>
                    <p class="resume-date">2017 - 2021</p>
                    <p>University name and any honors or relevant coursework.</p>
                </div>
            </div>
            <div class="content-section">
                <h2>Skills</h2>
                <ul class="skills-list">
                    <li>Web Development</li>
                    <li>JavaScript</li>
                    <li>CSS</li>
                    <li>HTML</li>
                    <li>Problem Solving</li>
                </ul>
            </div>
        </div>
    `
};

// Helper function to smoothly transition content
function changeContent(contentType) {
    // First fade out current content
    mainContainer.style.opacity = 0;
    
    // After fade out completes, update content and fade back in
    setTimeout(() => {
        // Update active state in navigation
        navLinks.forEach(link => {
            if (link.getAttribute('data-dialog') === contentType) {
                link.parentElement.classList.add('active-nav');
            } else {
                link.parentElement.classList.remove('active-nav');
            }
        });
        
        // Update content
        mainContainer.innerHTML = contentPages[contentType];
        
        // Fade back in
        mainContainer.style.opacity = 1;
    }, 300);
}

// Add click event listeners to navigation items
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        const contentType = this.getAttribute('data-dialog');
        if (contentPages[contentType]) {
            changeContent(contentType);
        }
    });
});

// Make the logo go back to home
document.getElementById('navbar__logo').addEventListener('click', function(e) {
    e.preventDefault();
    changeContent('home');
});

// Handle hidden links
hiddenLinks.forEach(link => {
    link.addEventListener('mouseover', function() {
        this.style.color = '#8aadff';
    });
    
    link.addEventListener('mouseout', function() {
        this.style.color = 'transparent';
    });
    
    // Make hidden links also trigger content changes
    link.addEventListener('click', function() {
        const linkText = this.textContent.trim().toLowerCase();
        if (contentPages[linkText]) {
            changeContent(linkText);
        }
    });
});
