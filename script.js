// === DATA CONFIGURATION ===
// Placeholder 360 image URL. User can replace these later.
const PLACEHOLDER_IMG = "https://pannellum.org/images/alma.jpg";
const PLACEHOLDER_IMG_2 = "https://pannellum.org/images/cerro-toco-0.jpg";
const PLACEHOLDER_IMG_3 = "https://pannellum.org/images/bma-0.jpg";

const scenes = {
    // --- KHU V ---
    "v-cong-chinh": {
        id: "v-cong-chinh",
        title: "Cổng chính Khu V",
        zone: "khu-v",
        panorama: PLACEHOLDER_IMG,
        mapCoords: { x: 46, y: 76 }, // Estimated percentages for minimap
        hotspots: [
            { pitch: -5, yaw: 10, type: "scene", target: "v-va", text: "Đi tới Giảng đường A" },
            { pitch: -5, yaw: -20, type: "scene", target: "v-vb", text: "Đi tới Giảng đường B" }
        ]
    },
    "v-va": {
        id: "v-va",
        title: "Giảng đường A (VA)",
        zone: "khu-v",
        panorama: PLACEHOLDER_IMG_2,
        mapCoords: { x: 27, y: 55 },
        hotspots: [
            { pitch: 0, yaw: 180, type: "scene", target: "v-cong-chinh", text: "Quay lại Cổng chính" },
            { pitch: 5, yaw: 45, type: "scene", target: "v-bai-do-xe", text: "Bãi đỗ xe" }
        ]
    },
    "v-vb": {
        id: "v-vb",
        title: "Giảng đường B (VB)",
        zone: "khu-v",
        panorama: PLACEHOLDER_IMG_3,
        mapCoords: { x: 54.5, y: 44 },
        hotspots: [
            { pitch: 0, yaw: 180, type: "scene", target: "v-cong-chinh", text: "Quay lại Cổng chính" }
        ]
    },
    "v-bai-do-xe": {
        id: "v-bai-do-xe",
        title: "Bãi đỗ xe CBGV (Khu V)",
        zone: "khu-v",
        panorama: PLACEHOLDER_IMG,
        mapCoords: { x: 27, y: 31 },
        hotspots: [
            { pitch: 0, yaw: 90, type: "scene", target: "v-va", text: "Về Giảng đường A" }
        ]
    },

    // --- KHU K ---
    "k-hanh-chinh": {
        id: "k-hanh-chinh",
        title: "Trung tâm Hành chính",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_2,
        mapCoords: { x: 50, y: 25 },
        hotspots: [
            { pitch: -5, yaw: -90, type: "scene", target: "k-hoi-truong", text: "Hội trường tròn" },
            { pitch: 0, yaw: 180, type: "scene", target: "k-dai-phun-nuoc", text: "Đài phun nước" }
        ]
    },
    "k-hoi-truong": {
        id: "k-hoi-truong",
        title: "Hội trường tròn",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_3,
        mapCoords: { x: 48, y: 18 },
        hotspots: [
            { pitch: 0, yaw: 90, type: "scene", target: "k-hanh-chinh", text: "TT Hành chính" }
        ]
    },
    "k-thu-vien": {
        id: "k-thu-vien",
        title: "Viện eSTI & Thư viện",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG,
        mapCoords: { x: 38, y: 20 },
        hotspots: [
            { pitch: 0, yaw: 180, type: "scene", target: "k-a", text: "Giảng đường A" }
        ]
    },
    "k-f": {
        id: "k-f",
        title: "Trung tâm Sinh viên (F)",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_2,
        mapCoords: { x: 62, y: 22 },
        hotspots: [
            { pitch: 0, yaw: -90, type: "scene", target: "k-hanh-chinh", text: "TT Hành chính" }
        ]
    },
    "k-d1-d2": {
        id: "k-d1-d2",
        title: "Các Phòng, Khoa (D1, D2)",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_3,
        mapCoords: { x: 65, y: 40 },
        hotspots: [
            { pitch: 0, yaw: 180, type: "scene", target: "k-e", text: "Đi tới khu E" }
        ]
    },
    "k-e": {
        id: "k-e",
        title: "Các Trung tâm, VP & Giảng đường (E)",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG,
        mapCoords: { x: 65, y: 60 },
        hotspots: [
            { pitch: 0, yaw: 0, type: "scene", target: "k-d1-d2", text: "Về khu D1, D2" }
        ]
    },
    "k-a": {
        id: "k-a",
        title: "Giảng đường A",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_2,
        mapCoords: { x: 40, y: 40 },
        hotspots: [
            { pitch: 0, yaw: 180, type: "scene", target: "k-b", text: "Giảng đường B" },
            { pitch: 0, yaw: 90, type: "scene", target: "k-dai-phun-nuoc", text: "Đài phun nước" }
        ]
    },
    "k-b": {
        id: "k-b",
        title: "Giảng đường B",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_3,
        mapCoords: { x: 40, y: 60 },
        hotspots: [
            { pitch: 0, yaw: 0, type: "scene", target: "k-a", text: "Giảng đường A" },
            { pitch: 0, yaw: -90, type: "scene", target: "k-c", text: "Giảng đường C" }
        ]
    },
    "k-c": {
        id: "k-c",
        title: "Giảng đường C",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG,
        mapCoords: { x: 33, y: 55 },
        hotspots: [
            { pitch: 0, yaw: 90, type: "scene", target: "k-b", text: "Giảng đường B" }
        ]
    },
    "k-dai-phun-nuoc": {
        id: "k-dai-phun-nuoc",
        title: "Đài phun nước",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_2,
        mapCoords: { x: 50, y: 50 },
        hotspots: [
            { pitch: 0, yaw: -90, type: "scene", target: "k-a", text: "Giảng đường A" },
            { pitch: 0, yaw: 90, type: "scene", target: "k-d1-d2", text: "Khu D1, D2" },
            { pitch: 0, yaw: 0, type: "scene", target: "k-hanh-chinh", text: "TT Hành chính" }
        ]
    },
    "k-the-thao": {
        id: "k-the-thao",
        title: "Khu Thể thao",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_3,
        mapCoords: { x: 22, y: 46 },
        hotspots: [
            { pitch: 0, yaw: 180, type: "scene", target: "k-san-bong", text: "Sân bóng đá/điền kinh" }
        ]
    },
    "k-san-bong": {
        id: "k-san-bong",
        title: "Sân bóng đá / Điền kinh",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG,
        mapCoords: { x: 22, y: 60 },
        hotspots: [
            { pitch: 0, yaw: 0, type: "scene", target: "k-the-thao", text: "Khu Thể thao" }
        ]
    },
    "k-ktx": {
        id: "k-ktx",
        title: "Khu Ký túc xá",
        zone: "khu-k",
        panorama: PLACEHOLDER_IMG_2,
        mapCoords: { x: 13, y: 35 },
        hotspots: [
            { pitch: 0, yaw: 90, type: "scene", target: "k-the-thao", text: "Khu Thể thao" }
        ]
    }
};

// === INITIALIZATION ===
let viewer;
let currentZone = "khu-v"; 
let currentSceneId = "v-cong-chinh";

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    initViewer();
    updateMap();
    
    // Tải trước các ảnh 360 ở chế độ nền để chuyển cảnh nhanh hơn
    setTimeout(preloadImages, 1000); 
});

function preloadImages() {
    const loadedUrls = new Set();
    Object.values(scenes).forEach(scene => {
        if (scene.panorama && !loadedUrls.has(scene.panorama)) {
            loadedUrls.add(scene.panorama);
            const img = new Image();
            img.src = scene.panorama;
        }
    });
    console.log("Đã bắt đầu tải trước (preload) các ảnh 360 vào cache.");
}

function initUI() {
    // Populate Sidebar Lists
    const khuVList = document.getElementById('khu-v-list');
    const khuKList = document.getElementById('khu-k-list');

    Object.values(scenes).forEach(scene => {
        const li = document.createElement('li');
        li.textContent = scene.title;
        li.dataset.id = scene.id;
        li.onclick = () => loadScene(scene.id);
        
        if (scene.zone === 'khu-v') {
            khuVList.appendChild(li);
        } else {
            khuKList.appendChild(li);
        }
    });

    // Accordion for sidebar
    const toggles = document.querySelectorAll('.section-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Collapse all
            document.querySelectorAll('.location-list').forEach(list => list.style.display = 'none');
            document.querySelectorAll('.section-toggle').forEach(t => t.classList.remove('active'));
            
            // Expand current
            this.classList.add('active');
            const target = document.getElementById(this.dataset.target + '-list');
            if (target) target.style.display = 'block';

            // Auto switch map zone
            switchMapZone(this.dataset.target);
        });
    });

    // Minimap Toggle Visibility
    const btnToggleMap = document.getElementById('toggle-minimap');
    const mapContainer = document.getElementById('minimap-container');
    btnToggleMap.addEventListener('click', () => {
        mapContainer.classList.toggle('map-hidden');
    });

    // Minimap Switcher (Khu V / Khu K)
    document.getElementById('btn-map-v').addEventListener('click', () => switchMapZone('khu-v'));
    document.getElementById('btn-map-k').addEventListener('click', () => switchMapZone('khu-k'));

    // Developer Helper: Click on map to get X, Y coordinates
    document.querySelector('.map-inner').addEventListener('click', function(e) {
        // Only log if we didn't click a dot directly
        if(e.target.classList.contains('map-dot') || e.target.classList.contains('map-dot-label')) return;
        
        const rect = this.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        console.log(`Tọa độ nhấp chuột: { x: ${Math.round(x)}, y: ${Math.round(y)} }`);
        alert(`Tọa độ: x: ${Math.round(x)}, y: ${Math.round(y)}\n(Bạn có thể sao chép số này vào file script.js)`);
    });
}

// Map Hotspot Function required by Pannellum Custom Hotspots
function customHotspot(hotSpotDiv, args) {
    hotSpotDiv.classList.add('custom-tooltip');
    var span = document.createElement('span');
    span.innerHTML = args;
    hotSpotDiv.appendChild(span);
    span.style.width = span.scrollWidth - 20 + 'px';
    span.style.marginLeft = -(span.scrollWidth - hotSpotDiv.offsetWidth) / 2 + 'px';
    span.style.marginTop = -span.scrollHeight - 12 + 'px';
}

function initViewer() {
    // Configure scenes for Pannellum
    const pannellumScenes = {};
    for (const [key, scene] of Object.entries(scenes)) {
        pannellumScenes[key] = {
            title: scene.title,
            type: "equirectangular",
            panorama: scene.panorama,
            autoLoad: true,
            hotSpots: scene.hotspots.map(hs => ({
                pitch: hs.pitch,
                yaw: hs.yaw,
                type: hs.type,
                text: hs.text,
                sceneId: hs.target,
                cssClass: "custom-hotspot",
                createTooltipFunc: customHotspot,
                createTooltipArgs: hs.text
            }))
        };
    }

    viewer = pannellum.viewer('panorama', {
        default: {
            firstScene: currentSceneId,
            author: "VKU",
            sceneFadeDuration: 1000,
            autoLoad: true,
            compass: true
        },
        scenes: pannellumScenes
    });

    // Listen to scene changes (Pannellum API doesn't have a direct onSceneChange callback easily accessible in free version sometimes, 
    // but we can catch it by overriding the loadScene method or polling. Actually, it does trigger 'scenechange' event in newer versions.)
    viewer.on('scenechange', function(sceneId) {
        currentSceneId = sceneId;
        const sceneData = scenes[sceneId];
        if (sceneData) {
            updateUI(sceneData);
            if(sceneData.zone !== currentZone) {
                switchMapZone(sceneData.zone);
            }
        }
    });

    // Initial UI update
    updateUI(scenes[currentSceneId]);
}

function loadScene(sceneId) {
    if (viewer && sceneId !== currentSceneId) {
        viewer.loadScene(sceneId);
        // The scenechange event will handle UI updates
    }
}

function switchMapZone(zone) {
    currentZone = zone;
    
    // Update map buttons
    document.getElementById('btn-map-v').classList.toggle('active', zone === 'khu-v');
    document.getElementById('btn-map-k').classList.toggle('active', zone === 'khu-k');

    // Update map images
    document.getElementById('map-image-v').style.display = zone === 'khu-v' ? 'block' : 'none';
    document.getElementById('map-image-k').style.display = zone === 'khu-k' ? 'block' : 'none';

    // Update Sidebar sections if they don't match
    document.querySelectorAll('.section-toggle').forEach(t => {
        if(t.dataset.target === zone) {
            t.classList.add('active');
            document.getElementById(zone + '-list').style.display = 'block';
        } else {
            t.classList.remove('active');
            document.getElementById(t.dataset.target + '-list').style.display = 'none';
        }
    });

    // Re-draw map dots for the current zone
    updateMap();
}

function updateUI(sceneData) {
    document.getElementById('current-location-name').textContent = sceneData.title;

    // Update sidebar active state
    document.querySelectorAll('.location-list li').forEach(li => {
        li.classList.toggle('active', li.dataset.id === sceneData.id);
    });

    // Highlight map dot
    document.querySelectorAll('.map-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.id === sceneData.id);
    });
}

function updateMap() {
    const mapDotsContainer = document.getElementById('map-dots');
    mapDotsContainer.innerHTML = ''; // Clear existing dots

    Object.values(scenes).forEach(scene => {
        if (scene.zone === currentZone) {
            const dot = document.createElement('div');
            dot.className = `map-dot ${scene.id === currentSceneId ? 'active' : ''}`;
            dot.style.left = `${scene.mapCoords.x}%`;
            dot.style.top = `${scene.mapCoords.y}%`;
            dot.dataset.id = scene.id;
            dot.title = scene.title;

            // Add label
            const label = document.createElement('div');
            label.className = 'map-dot-label';
            label.textContent = scene.title;
            dot.appendChild(label);

            // Click event
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                loadScene(scene.id);
            });

            mapDotsContainer.appendChild(dot);
        }
    });
}
