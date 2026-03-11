document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 3D Gas Molecule Viewer (Hero Section)
    // ==========================================
    const canvasContainer = document.getElementById('molecule-canvas');
    if (canvasContainer && typeof THREE !== 'undefined') {
        initMoleculeViewer(canvasContainer);
    }

    // Simulate live data updates for the dashboard preview values
    const lpgValues = document.querySelectorAll('.lpg-val');
    
    // Simulate natural data fluctuation
    setInterval(() => {
        if (!lpgValues.length) return;
        
        // Base value around 0.02%
        let baseLpg = 0.02;
        let change = (Math.random() - 0.5) * 0.01;
        let newValue = Math.max(0.00, baseLpg + change).toFixed(3);
        
        lpgValues.forEach(el => el.textContent = `${newValue}%`);
    }, 2000);

    // Interactive Hover on Bento Cards
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        // Only apply the 1.05 scale hover to CTA as requested, but we can keep subtle interactions for bento if needed.
        // The prompt says "Hover interactions: scale 1.05, blue glow shadow". 
        // We implemented this broadly on CTA buttons in CSS and specifically on the cards.
        
        card.addEventListener('mousemove', (e) => {
            // Only apply tilt to Bento grid cards, not large sections
            if (!card.closest('.bento-grid') && !card.closest('.imp-list')) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Apply slight tilt effect
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -2;
            const rotateY = ((x - centerX) / centerX) * 2;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
             if (!card.closest('.bento-grid') && !card.closest('.imp-list')) return;
            card.style.transform = '';
            card.style.transition = 'transform 0.5s ease';
        });
        
        card.addEventListener('mouseenter', () => {
             if (!card.closest('.bento-grid') && !card.closest('.imp-list')) return;
            card.style.transition = 'none';
        });
    });
});

// ==========================================
// Three.js Gas Molecule Viewer Implementation
// ==========================================
function initMoleculeViewer(container) {
    // 1. Scene Setup
    const scene = new THREE.Scene();
    
    // We want the background to be transparent so the CSS gradient shows through
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    // Size to container
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 12;

    // Lighting (Scientific, calm blue aesthetic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xBDE8F5, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    
    const fillLight = new THREE.PointLight(0x4988C4, 0.8);
    fillLight.position.set(-10, -5, 5);
    scene.add(fillLight);

    // 2. Molecule Data Definitions
    // Coordinates are approximate scaled angstroms
    const molecules = {
        propane: {
            name: 'Propane',
            formula: 'C3H8',
            atoms: [
                { type: 'C', pos: [0, 0, 0] },         // C2 (center)
                { type: 'C', pos: [-1.28, -0.74, 0] }, // C1
                { type: 'C', pos: [1.28, -0.74, 0] },  // C3
                { type: 'H', pos: [0, 0.63, 0.88] },
                { type: 'H', pos: [0, 0.63, -0.88] },
                { type: 'H', pos: [-1.28, -1.37, 0.88] },
                { type: 'H', pos: [-1.28, -1.37, -0.88] },
                { type: 'H', pos: [-2.18, -0.11, 0] },
                { type: 'H', pos: [1.28, -1.37, 0.88] },
                { type: 'H', pos: [1.28, -1.37, -0.88] },
                { type: 'H', pos: [2.18, -0.11, 0] }
            ],
            bonds: [
                [0, 1], [0, 2], [0, 3], [0, 4],
                [1, 5], [1, 6], [1, 7],
                [2, 8], [2, 9], [2, 10]
            ]
        },
        butane: {
            name: 'Butane',
            formula: 'C4H10',
            atoms: [
                { type: 'C', pos: [-1.92, 0.44, 0] },  // C1
                { type: 'C', pos: [-0.64, -0.44, 0] }, // C2
                { type: 'C', pos: [0.64, 0.44, 0] },   // C3
                { type: 'C', pos: [1.92, -0.44, 0] },  // C4
                { type: 'H', pos: [-1.92, 1.07, 0.88] },
                { type: 'H', pos: [-1.92, 1.07, -0.88] },
                { type: 'H', pos: [-2.82, -0.19, 0] },
                { type: 'H', pos: [-0.64, -1.07, 0.88] },
                { type: 'H', pos: [-0.64, -1.07, -0.88] },
                { type: 'H', pos: [0.64, 1.07, 0.88] },
                { type: 'H', pos: [0.64, 1.07, -0.88] },
                { type: 'H', pos: [1.92, -1.07, 0.88] },
                { type: 'H', pos: [1.92, -1.07, -0.88] },
                { type: 'H', pos: [2.82, 0.19, 0] }
            ],
            bonds: [
                [0, 1], [1, 2], [2, 3],
                [0, 4], [0, 5], [0, 6],
                [1, 7], [1, 8],
                [2, 9], [2, 10],
                [3, 11], [3, 12], [3, 13]
            ]
        }
    };

    // Materials
    const materials = {
        'C': new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 60 }), // Dark Gray Carbon
        'H': new THREE.MeshPhongMaterial({ color: 0xdcdcdc, shininess: 40 }), // Light Gray Hydrogen
        'bond': new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 20 })
    };

    const geometries = {
        'C': new THREE.SphereGeometry(0.5, 32, 32),
        'H': new THREE.SphereGeometry(0.3, 32, 32)
    };

    let moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    // 3. Build Molecule Function
    function buildMolecule(gasKey) {
        // Clear old
        while (moleculeGroup.children.length > 0) {
            moleculeGroup.remove(moleculeGroup.children[0]);
        }
        
        // Reset rotation
        moleculeGroup.rotation.x = 0;
        moleculeGroup.rotation.y = 0;
        
        const data = molecules[gasKey];
        if (!data) return;

        // Build Atoms
        const atomMeshes = [];
        data.atoms.forEach(atom => {
            const mesh = new THREE.Mesh(geometries[atom.type], materials[atom.type]);
            mesh.position.set(atom.pos[0], atom.pos[1], atom.pos[2]);
            moleculeGroup.add(mesh);
            atomMeshes.push(mesh);
        });

        // Build Bonds
        data.bonds.forEach(bond => {
            const startNode = atomMeshes[bond[0]].position;
            const endNode = atomMeshes[bond[1]].position;
            
            const distance = startNode.distanceTo(endNode);
            const cylinder = new THREE.CylinderGeometry(0.1, 0.1, distance, 8);
            const bondMesh = new THREE.Mesh(cylinder, materials.bond);
            
            // Align cylinder between atoms
            const midPoint = new THREE.Vector3().addVectors(startNode, endNode).multiplyScalar(0.5);
            bondMesh.position.copy(midPoint);
            bondMesh.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3().subVectors(endNode, startNode).normalize()
            );
            
            moleculeGroup.add(bondMesh);
        });
        
        // Update Labels
        document.getElementById('mol-name').textContent = data.name;
        document.getElementById('mol-formula').textContent = data.formula;
    }

    // Initialize default (Propane)
    buildMolecule('propane');

    // 4. Interaction & Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragTimeout = null;
    let isInteracting = false;

    // Handle mouse drag
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        isInteracting = true;
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
        if (dragTimeout) clearTimeout(dragTimeout);
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };

        const rotationSpeed = 0.005;
        moleculeGroup.rotation.y += deltaMove.x * rotationSpeed;
        moleculeGroup.rotation.x += deltaMove.y * rotationSpeed;

        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    // Touch support
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        isInteracting = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (dragTimeout) clearTimeout(dragTimeout);
    }, {passive: false});

    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling while rotating
        
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };

        const rotationSpeed = 0.005;
        moleculeGroup.rotation.y += deltaMove.x * rotationSpeed;
        moleculeGroup.rotation.x += deltaMove.y * rotationSpeed;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, {passive: false});

    const stopDrag = () => {
        isDragging = false;
        // Resume auto-rotation after a short delay
        dragTimeout = setTimeout(() => {
            isInteracting = false;
        }, 3000);
    };

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);

    // 5. Selector Buttons
    const buttons = document.querySelectorAll('.mol-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active-mol'));
            e.target.classList.add('active-mol');
            
            // Rebuild
            const gas = e.target.getAttribute('data-gas');
            buildMolecule(gas);
        });
    });

    // 6. Render Loop
    // Very slow automatic rotation: ~12-15 seconds per revolution => ~0.008 rad per frame at 60fps
    const autoRotateSpeed = 0.007; 
    
    // Handle Window Resize
    window.addEventListener('resize', () => {
        if(!container.clientWidth) return;
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    });

    function animate() {
        requestAnimationFrame(animate);
        
        if (!isInteracting) {
            moleculeGroup.rotation.y += autoRotateSpeed;
            moleculeGroup.rotation.x += autoRotateSpeed * 0.3; // Slight tilt
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
}
