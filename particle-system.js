// Isometric Energy Landscape Particle System
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.gridSpacing = 20; // Spacing between particles in logical grid
        this.hasAnimated = false;
        this.time = 0;
        
        this.init();
        
        // Set up Intersection Observer for scroll trigger
        this.setupScrollObserver();
        
        window.addEventListener('resize', () => {
            this.init();
            if (this.hasAnimated) {
                this.createEnergyLandscape();
            }
        });
    }
    
    init() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    // Convert isometric coordinates to screen coordinates
    isoToScreen(x, y, z) {
        const screenX = (x - y) * Math.cos(Math.PI / 8);
        const screenY = (x + y) * Math.sin(Math.PI / 8) - z;
        return { x: screenX, y: screenY };
    }
    
    setupScrollObserver() {
        const hobbiesSection = document.getElementById('hobbies');
        if (!hobbiesSection) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.createEnergyLandscape();
                    this.hasAnimated = true;
                    this.animate();
                }
            });
        }, {
            threshold: 0.3
        });
        
        observer.observe(hobbiesSection);
    }
    
    createEnergyLandscape() {
        this.particles = [];
        const cols = 50; // Columns
        const rows = 50; // Rows
        
        // Position on the right side
        const offsetX = this.canvas.width;
        const offsetY = this.canvas.height;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Create triangular grid - skip particles outside triangle
                const rowProgress = row / rows;
                const maxColForRow = Math.floor(cols * (1 - rowProgress * 0.2)); // Triangular shape
                
                if (col > maxColForRow) continue; // Skip to create triangle
                
                const gridX = col * this.gridSpacing;
                const gridY = row * this.gridSpacing - (rows * this.gridSpacing / 2);
                
                // Calculate the isometric position
                const iso = this.isoToScreen(gridX, gridY, 0);
                const targetX = offsetX + iso.x;
                const targetY = offsetY + iso.y;
                
                const startX = -100; // Start off-screen to the left
                
                // Stagger the entry animation
                const delay = col * 0.01;
                
                this.particles.push({
                    gridX: gridX,
                    gridY: gridY,
                    x: startX,
                    y: targetY,
                    targetX: targetX,
                    targetY: targetY,
                    z: 0, // Height (will oscillate for waves)
                    size: 1.2,
                    opacity: 0.7,
                    phase: Math.random() * Math.PI * 2,
                    delay: delay,
                    hasEntered: false,
                    entryProgress: 0,
                    col: col,
                    row: row
                });
            }
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time += 0.016;
        
        const offsetX = this.canvas.width * 0.6;
        const offsetY = this.canvas.height /2 ;
        
        // Sort particles by depth for proper rendering (back to front)
        const sortedParticles = [...this.particles].sort((a, b) => {
            return (a.gridX + a.gridY) - (b.gridX + b.gridY);
        });
        
        // Draw connections (grid lines) first - white only, show only two visible sides
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 0.8;
        
        for (let particle of sortedParticles) {
            if (!particle.hasEntered || particle.entryProgress < 0.5) continue;
            
            // Find right neighbor (visible side 1)
            const rightNeighbor = this.particles.find(p => 
                p.col === particle.col + 1 && p.row === particle.row
            );
            
            // Find down neighbor (visible side 2)
            const downNeighbor = this.particles.find(p => 
                p.col === particle.col && p.row === particle.row + 1
            );
            
            // Draw line to right neighbor
            if (rightNeighbor && rightNeighbor.hasEntered) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(rightNeighbor.x, rightNeighbor.y);
                this.ctx.stroke();
            }
            
            // Draw line to down neighbor
            if (downNeighbor && downNeighbor.hasEntered) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(downNeighbor.x, downNeighbor.y);
                this.ctx.stroke();
            }
        }
        
        // Update and draw particles
        sortedParticles.forEach(particle => {
            // Entry animation
            if (!particle.hasEntered) {
                if (this.time > particle.delay) {
                    particle.entryProgress += 0.08;
                    if (particle.entryProgress >= 1) {
                        particle.entryProgress = 1;
                        particle.hasEntered = true;
                    }
                    const ease = 1 - Math.pow(1 - particle.entryProgress, 3);
                    particle.x = particle.x + (particle.targetX - particle.x) * ease * 0.15;
                }
            }
            
            // Create detailed crests and troughs with multiple wave frequencies
            if (particle.hasEntered) {
                // Multiple wave layers for complex terrain
                const wave1 = Math.sin(this.time * 0.6 + particle.gridX * 0.015) * 40;
                const wave2 = Math.cos(this.time * 0.8 + particle.gridY * 0.02) * 35;
                const wave3 = Math.sin(this.time * 1.2 + particle.gridX * 0.01 + particle.gridY * 0.01) * 25;
                const wave4 = Math.cos(this.time * 0.4 + particle.gridX * 0.03) * 20;
                
                // Combine waves for complex landscape
                particle.z = wave1 + wave2 + wave3 + wave4;
                
                // Update screen position based on z (height)
                const iso = this.isoToScreen(particle.gridX, particle.gridY, particle.z);
                particle.x = offsetX + iso.x;
                particle.y = offsetY + iso.y;
            }
            
            // Draw particle - white only, brightness based on height
            const alpha = particle.hasEntered ? particle.opacity : particle.opacity * particle.entryProgress;
            
            // Brightness based on height (crests are brighter, troughs are dimmer)
            const heightFactor = (particle.z + 120) / 240; // Normalize to 0-1
            const brightness = Math.max(0.2, Math.min(1, heightFactor));
            
            // Draw particle with white color, varying opacity
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add extra glow for high peaks (crests)
            if (particle.z > 40) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
});
