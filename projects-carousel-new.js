// Simple Smooth Drag Scrolling Carousel
document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.carousel-track');
    
    if (!track) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    let velocity = 0;
    let lastX = 0;
    let lastTime = Date.now();
    
    track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.style.cursor = 'grabbing';
        track.style.scrollSnapType = 'none';
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        velocity = 0;
        lastX = e.pageX;
        lastTime = Date.now();
    });
    
    track.addEventListener('mouseleave', () => {
        if (isDown) {
            isDown = false;
            track.style.cursor = 'grab';
            track.style.scrollSnapType = 'x mandatory';
            applyMomentum();
        }
    });
    
    track.addEventListener('mouseup', () => {
        if (isDown) {
            isDown = false;
            track.style.cursor = 'grab';
            track.style.scrollSnapType = 'x mandatory';
            applyMomentum();
        }
    });
    
    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const currentTime = Date.now();
        const currentX = e.pageX;
        const deltaTime = currentTime - lastTime;
        const deltaX = currentX - lastX;
        
        if (deltaTime > 0) {
            velocity = deltaX / deltaTime;
        }
        
        lastX = currentX;
        lastTime = currentTime;
        
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.5;
        track.scrollLeft = scrollLeft - walk;
    });
    
    function applyMomentum() {
        if (Math.abs(velocity) < 0.1) return;
        
        const friction = 0.95;
        let currentVelocity = velocity * 100;
        
        function momentumScroll() {
            currentVelocity *= friction;
            track.scrollLeft -= currentVelocity;
            
            if (Math.abs(currentVelocity) > 0.5) {
                requestAnimationFrame(momentumScroll);
            } else {
                track.style.scrollSnapType = 'x mandatory';
            }
        }
        
        requestAnimationFrame(momentumScroll);
    }
    
    // Prevent default drag behavior
    track.addEventListener('dragstart', (e) => e.preventDefault());
});

