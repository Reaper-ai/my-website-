// Graph Configuration
const config = {
    nodeCount: 512,
    baseSize: 3,
    minSizeMultiplier: 0.4,
    maxSizeMultiplier: 1.2,
    minDegree: 1,
    maxDegree: 5,
    sphereRadius: 400,
    rotationSpeedX: 0.002,
    rotationSpeedY: 0.003,
    moveSpeed: 0.001,
    mouseInfluence: 80,
    mouseStrength: 0.3,
    minLineWidth: 0.1,
    maxLineWidth: 0.3,
    connectionUpdateInterval: 60 // Higher = less frequent edge changes (30-120 recommended)
};

// Canvas Setup
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Resize handler
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initNodes();
});

// Node Class
class Node {
    constructor() {
        // Generate random point inside sphere (not just on surface)
        // Use rejection sampling for uniform distribution
        let x, y, z, r;
        do {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
            r = Math.sqrt(x * x + y * y + z * z);
        } while (r > 1 || r < 0.01);
        
        // Normalize and scale to varying distances from center
        // Some nodes near surface, some deep inside, organic distribution
        const distanceFromCenter = Math.pow(Math.random(), 0.6) * config.sphereRadius * (0.3 + Math.random() * 0.9);
        
        this.x3d = (x / r) * distanceFromCenter;
        this.y3d = (y / r) * distanceFromCenter;
        this.z3d = (z / r) * distanceFromCenter;
        
        // Store for movement
        const currentR = Math.sqrt(this.x3d ** 2 + this.y3d ** 2 + this.z3d ** 2);
        this.theta = Math.atan2(this.y3d, this.x3d);
        this.phi = Math.acos(this.z3d / currentR);
        this.radius = currentR;
        
        // Target position for slow movement
        this.targetTheta = this.theta + (Math.random() - 0.5) * 0.5;
        this.targetPhi = this.phi + (Math.random() - 0.5) * 0.5;
        this.targetRadius = this.radius + (Math.random() - 0.5) * 30;
        
        // 2D projected position
        this.x = 0;
        this.y = 0;
        this.z = 0;
        
        // Size multiplier between 0.4x and 1.2x
        this.sizeMultiplier = config.minSizeMultiplier + 
            Math.random() * (config.maxSizeMultiplier - config.minSizeMultiplier);
        this.baseSize = config.baseSize * this.sizeMultiplier;
        this.size = this.baseSize;
        
        // Degree between 1 and 5
        this.degree = Math.floor(Math.random() * (config.maxDegree - config.minDegree + 1)) + config.minDegree;
        
        // Color based on degree
        this.color = this.getColorByDegree();
        this.connections = [];
    }
    
    getColorByDegree() {
        const colors = [
            'rgba(120, 120, 120, 0.7)',  // degree 1
            'rgba(140, 140, 140, 0.8)',  // degree 2
            'rgba(160, 160, 160, 0.85)', // degree 3
            'rgba(190, 190, 190, 0.9)',  // degree 4
            'rgba(220, 220, 220, 1.0)'   // degree 5
        ];
        return colors[this.degree - 1];
    }
    
    update(mouseX, mouseY, centerX, centerY, rotationX, rotationY) {
        // Slowly move towards target position
        this.theta += (this.targetTheta - this.theta) * config.moveSpeed;
        this.phi += (this.targetPhi - this.phi) * config.moveSpeed;
        this.radius += (this.targetRadius - this.radius) * config.moveSpeed;
        
        // Occasionally set new target
        if (Math.random() < 0.001) {
            this.targetTheta = this.theta + (Math.random() - 0.5) * 0.3;
            this.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi + (Math.random() - 0.5) * 0.3));
            this.targetRadius = Math.max(config.sphereRadius * 0.3, Math.min(config.sphereRadius * 1.2, this.radius + (Math.random() - 0.5) * 40));
        }
        
        // Update 3D position based on spherical coordinates and varying radius
        this.x3d = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.y3d = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        this.z3d = this.radius * Math.cos(this.phi);
        
        // Apply rotation to the entire sphere
        let x = this.x3d;
        let y = this.y3d;
        let z = this.z3d;
        
        // Rotate around X axis
        let y1 = y * Math.cos(rotationX) - z * Math.sin(rotationX);
        let z1 = y * Math.sin(rotationX) + z * Math.cos(rotationX);
        
        // Rotate around Y axis
        let x2 = x * Math.cos(rotationY) - z1 * Math.sin(rotationY);
        let z2 = x * Math.sin(rotationY) + z1 * Math.cos(rotationY);
        
        // Project to 2D (simple orthographic projection)
        this.x = centerX + x2;
        this.y = centerY + y1;
        this.z = z2;
        
        // Size based on depth (z-position) for 3D effect
        const depthScale = (z2 + config.sphereRadius) / (2 * config.sphereRadius);
        this.size = this.baseSize * (0.5 + depthScale * 0.5);
        
        // Subtle mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.mouseInfluence && distance > 0) {
            const force = (config.mouseInfluence - distance) / config.mouseInfluence;
            const angle = Math.atan2(dy, dx);
            this.theta -= Math.cos(angle) * force * config.mouseStrength * 0.01;
            this.phi -= Math.sin(angle) * force * config.mouseStrength * 0.01;
            this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
        }
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add glow effect for higher degree nodes
        if (this.degree >= 4) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Initialize nodes
let nodes = [];
let rotationX = 0;
let rotationY = 0;
const centerX = () => width / 2;
const centerY = () => height / 2;

function initNodes() {
    nodes = [];
    
    for (let i = 0; i < config.nodeCount; i++) {
        nodes.push(new Node());
    }
    
    // Initial projection
    nodes.forEach(node => {
        node.update(width / 2, height / 2, width / 2, height / 2, 0, 0);
    });
    
    // Initial connection setup
    findConnections();
}

// Find connections based on 3D distance and degree
function findConnections() {
    nodes.forEach(node => {
        node.connections = [];
        
        // Sort other nodes by 3D distance
        const others = nodes
            .filter(n => n !== node)
            .map(n => ({
                node: n,
                distance: Math.sqrt(
                    (n.x3d - node.x3d) ** 2 + 
                    (n.y3d - node.y3d) ** 2 + 
                    (n.z3d - node.z3d) ** 2
                )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, node.degree);
        
        // Connect to closest nodes up to degree limit
        others.forEach(({ node: other }) => {
            node.connections.push(other);
        });
    });
}

// Draw connections
function drawConnections() {
    const drawn = new Set();
    
    nodes.forEach((node, i) => {
        node.connections.forEach(connected => {
            // Create unique key using node indices
            const connectedIndex = nodes.indexOf(connected);
            const key = i < connectedIndex ? `${i}-${connectedIndex}` : `${connectedIndex}-${i}`;
            
            if (!drawn.has(key)) {
                drawn.add(key);
                
                // Calculate 3D distance for line width variation
                const dx3d = connected.x3d - node.x3d;
                const dy3d = connected.y3d - node.y3d;
                const dz3d = connected.z3d - node.z3d;
                const distance3d = Math.sqrt(dx3d * dx3d + dy3d * dy3d + dz3d * dz3d);
                
                // Closer nodes = thicker lines, farther = thinner
                const maxDist = config.sphereRadius * 2;
                const distanceRatio = 1 - Math.min(distance3d / maxDist, 1);
                const lineWidth = config.minLineWidth + (config.maxLineWidth - config.minLineWidth) * distanceRatio;
                
                // Average depth for connection - makes closer edges brighter
                const avgZ = (node.z + connected.z) / 2;
                const depthScale = (avgZ + config.sphereRadius * 1.5) / (config.sphereRadius * 3);
                const opacity = Math.max(0.3, Math.min(0.7, 0.3 + depthScale * 0.5));
                
                // Draw white connections with variable width
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(connected.x, connected.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            }
        });
    });
}

// Mouse tracking
let mouseX = width / 2;
let mouseY = height / 2;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Update coordinates display
    document.getElementById('coords').textContent = `${Math.round(e.clientX)}, ${Math.round(e.clientY)}`;
});

// Fullscreen toggle
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// Animation loop
let frameCount = 0;

function animate() {
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 10, 1)';
    ctx.fillRect(0, 0, width, height);
    
    // Update rotation of the entire sphere
    rotationX += config.rotationSpeedX;
    rotationY += config.rotationSpeedY;
    
    // Update all nodes
    nodes.forEach(node => {
        node.update(mouseX, mouseY, centerX(), centerY(), rotationX, rotationY);
    });
    
    // Update connections at controlled intervals (creates dynamic edge switching effect)
    // Lower interval = more frequent changes, Higher = more stable connections
    if (frameCount % config.connectionUpdateInterval === 0) {
        findConnections();
    }
    
    // Sort nodes by z-depth (draw far ones first)
    const sortedNodes = [...nodes].sort((a, b) => a.z - b.z);
    
    // Draw connections and nodes
    drawConnections();
    sortedNodes.forEach(node => node.draw());
    
    frameCount++;
    requestAnimationFrame(animate);
}

// Update temperature (random fluctuation for demo)
function updateTemperature() {
    const temp = 26 + Math.random() * 4;
    document.getElementById('temperature').textContent = `${temp.toFixed(1)}°C`;
}

// Initialize
initNodes();
animate();

// Update temperature every 5 seconds
setInterval(updateTemperature, 5000);

// Add particles effect on click
canvas.addEventListener('click', (e) => {
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Create ripple effect - push nearby nodes
    nodes.forEach(node => {
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100 && distance > 0) {
            const force = (100 - distance) / 100;
            node.vx += (dx / distance) * force * 3;
            node.vy += (dy / distance) * force * 3;
        }
    });
});
