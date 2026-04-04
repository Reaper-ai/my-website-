// Skill/Education Card 3D Flip Toggle - Bottom Card Only
document.addEventListener('DOMContentLoaded', function() {
    const flipContainer = document.querySelector('.card-flip-container');
    
    if (flipContainer) {
        flipContainer.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    }
});
