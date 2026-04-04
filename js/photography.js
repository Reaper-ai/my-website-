document.addEventListener('DOMContentLoaded', async () => {
    // Fetch photo data from JSON
    let photoData;
    try {
        const response = await fetch('../json/photos.json');
        if (!response.ok) throw new Error('Network response was not ok');
        photoData = await response.json();
    } catch (error) {
        console.error('Error loading photos.json:', error);
        return; // Stop initialization if data fails
    }

    const depotSelection = document.getElementById('depot-selection');
    const galleryView = document.getElementById('gallery-view');
    const masonryGrid = document.getElementById('masonry-grid');
    const galleryTitle = document.getElementById('gallery-title');
    const galleryCount = document.getElementById('gallery-count');
    const backToDepotBtn = document.getElementById('back-to-depot');
    const splitPanes = document.querySelectorAll('.split-pane');
    
    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeLightboxBtn = document.getElementById('close-lightbox');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const imageCounter = document.getElementById('image-counter');

    let currentCategory = '';
    let currentImages = [];
    let currentImageIndex = 0;

    // Handle Category Selection
    splitPanes.forEach(pane => {
        pane.addEventListener('click', () => {
            const category = pane.getAttribute('data-category');
            openGallery(category);
        });
    });

    // Handle Back to Depot
    backToDepotBtn.addEventListener('click', () => {
        closeGallery();
    });

    function openGallery(category) {
        currentCategory = category;
        currentImages = photoData[category];
        
        // Setup Gallery Header
        galleryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1) + " Archive";
        galleryCount.textContent = `${currentImages.length} items`;
        
        // Clear Grid
        masonryGrid.innerHTML = '';
        
        // Transition Views
        depotSelection.classList.add('fade-out');
        setTimeout(() => {
            depotSelection.style.display = 'none';
            galleryView.classList.remove('hidden');
            galleryView.classList.add('active');
            
            // Populate Grid
            populateGrid(currentImages);
        }, 800);
    }

    function closeGallery() {
        galleryView.classList.remove('active');
        galleryView.classList.add('hidden');
        
        setTimeout(() => {
            depotSelection.style.display = 'flex';
            // Force reflow
            void depotSelection.offsetWidth;
            depotSelection.classList.remove('fade-out');
        }, 100);
    }

    function populateGrid(images) {
        images.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const imageEl = document.createElement('img');
            imageEl.src = img.src;
            imageEl.alt = img.title;
            imageEl.loading = 'lazy';
            
            // Add staggered loading animation
            imageEl.onload = () => {
                setTimeout(() => {
                    item.classList.add('loaded');
                }, index * 100); // 100ms stagger
            };
            
            const overlay = document.createElement('div');
            overlay.className = 'item-overlay';
            overlay.innerHTML = `
                <span class="item-title">${img.title}</span>
                <span class="item-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                </span>
            `;
            
            item.appendChild(imageEl);
            item.appendChild(overlay);
            
            item.addEventListener('click', () => openLightbox(index));
            
            masonryGrid.appendChild(item);
        });
    }

    // Lightbox Logic
    function openLightbox(index) {
        currentImageIndex = index;
        updateLightboxContent();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateLightboxContent();
    }

    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateLightboxContent();
    }

    function updateLightboxContent() {
        const imgData = currentImages[currentImageIndex];
        lightboxImg.src = imgData.fullSrc || imgData.src;
        lightboxCaption.textContent = imgData.title;
        imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    }

    // Lightbox Event Listeners
    closeLightboxBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', nextImage);
    prevBtn.addEventListener('click', prevImage);
    
    // Close on overlay click
    lightbox.addEventListener('click', (e) => {
        if (e.target.classList.contains('lightbox-overlay') || e.target.classList.contains('lightbox-img-container')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
});
