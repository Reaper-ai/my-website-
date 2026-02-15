// Constellation Effect for Left Side
class ConstellationEffect {
    constructor(canvasId, sectionId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.starCount = 40; // Number of stars
        this.maxDistance = 150; // Max distance for connections
        this.hasAnimated = false;
        this.time = 0;
        this.sectionId = sectionId;
        
        this.init();
        this.setupScrollObserver();
        
        window.addEventListener('resize', () => {
            this.init();
            if (this.hasAnimated) {
                this.createConstellation();
            }
        });
    }
    
    init() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    setupScrollObserver() {
        const section = document.getElementById(this.sectionId);
        if (!section) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.createConstellation();
                    this.hasAnimated = true;
                    this.animate();
                }
            });
        }, {
            threshold: 0.3
        });
        
        observer.observe(section);
    }
    
    createConstellation() {
        this.stars = [];
        
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                targetX: Math.random() * this.canvas.width,
                targetY: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time += 0.016;
        
        // Draw connections first (constellation lines)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < this.stars.length; i++) {
            for (let j = i + 1; j < this.stars.length; j++) {
                const dx = this.stars[i].x - this.stars[j].x;
                const dy = this.stars[i].y - this.stars[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.maxDistance) {
                    const opacity = (1 - distance / this.maxDistance) * 0.2;
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.stars[i].x, this.stars[i].y);
                    this.ctx.lineTo(this.stars[j].x, this.stars[j].y);
                    this.ctx.stroke();
                }
            }
        }
        
        // Update and draw stars
        this.stars.forEach(star => {
            // Slow drift movement
            star.x += star.vx;
            star.y += star.vy;
            
            // Boundary wrapping
            if (star.x < 0) star.x = this.canvas.width;
            if (star.x > this.canvas.width) star.x = 0;
            if (star.y < 0) star.y = this.canvas.height;
            if (star.y > this.canvas.height) star.y = 0;
            
            // Twinkle effect
            const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
            const currentOpacity = star.opacity * twinkle;
            
            // Draw star
            this.ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow for larger stars
            if (star.size > 1.2) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.3})`;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConstellationEffect('constellationCanvas', 'hobbies');
    new ConstellationEffect('articlesConstellationCanvas', 'articles');
});
