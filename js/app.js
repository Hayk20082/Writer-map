// WRITERS is global from data.js

const app = document.getElementById("app");

// Helper to convert hex to rgba
function hexToRgba(hex, alpha) {
    let r = 0, g = 0, b = 0;

    // 3-digit hex
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }

    return `rgba(${r},${g},${b},${alpha})`;
}

// --- GOOGLE MAP INITIALIZATION ---

let gmap;

function initGoogleMap() {
    // Wait until HTML map container is created
    const wait = setInterval(() => {
        const mapDiv = document.getElementById("googleMap");
        if (mapDiv) {
            clearInterval(wait);

            gmap = new google.maps.Map(mapDiv, {
                zoom: 6,
                center: { lat: 40.2, lng: 44.5 }, // Armenia
                mapTypeId: "roadmap",
            });

            addMapMarkers();
        }
    }, 100);
}

function addMapMarkers() {

    // Remove old markers & lines if they exist
    if (window.currentMarkers) {
        window.currentMarkers.forEach(m => m.setMap(null));
        window.currentMarkers = [];
    }
    if (window.currentLines) {
        window.currentLines.forEach(l => l.setMap(null));
        window.currentLines = [];
    }

    window.currentMarkers = [];
    window.currentLines = [];

    WRITERS.forEach(writer => {

        // --- 1) DRAW DASHED PATH BETWEEN EVENTS ---
        const pathCoords = writer.events.map(ev => ({
            lat: ev.lat,
            lng: ev.lng
        }));

        const dashedLine = new google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeOpacity: 0,   // real stroke invisible
            strokeWeight: 2,
            icons: [
                {
                    icon: {
                        path: "M 0,-1 0,1", // small dash element
                        strokeOpacity: 1,
                        strokeColor: writer.color,
                        scale: 3
                    },
                    offset: "0",
                    repeat: "10px"
                }
            ],
            map: gmap
        });

        window.currentLines.push(dashedLine);

        // --- 2) ADD COLORED CIRCLE MARKERS ---
        writer.events.forEach(event => {
            if (!event.lat || !event.lng) return;

            const icon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: writer.color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 7 // circle size
            };

            const marker = new google.maps.Marker({
                position: { lat: event.lat, lng: event.lng },
                map: gmap,
                icon: icon,
                title: `${writer.name}: ${event.title}`
            });

            window.currentMarkers.push(marker);

            // --- 3) OPEN EVENT ON CLICK ---
            marker.addListener("click", () => {
                openMapEvent(writer.id, event.id);
            });
        });
    });
}


// --- MAIN HOME VIEW ---

function renderHome() {
    const mid = Math.ceil(WRITERS.length / 2);
    const leftWriters = WRITERS.slice(0, mid);
    const rightWriters = WRITERS.slice(mid);

    const mapHTML = `
    <div class="map-view" id="mapView">
        <div class="map-content" id="mapContent">

            <!-- REAL GOOGLE MAP -->
            <div id="googleMap" style="width:100%; height:100%;"></div>

        </div>

        <div class="map-info-window" id="mapInfoWindow">
            <button class="map-info-close" onclick="closeMapEvent()">&times;</button>
            <div id="mapInfoContent"></div>
        </div>
    </div>
    `;

    app.innerHTML = `
        <header>
            <a href="#" class="logo"></a>
        </header>
        <div class="main-container">
            <div class="writers-column">
                <h3>Գրողներ</h3>
                ${leftWriters.map(w => `
                    <div class="writer-item" style="border-left: 3px solid ${w.color}; background-color: ${hexToRgba(w.color, 0.1)};" onclick="window.location.hash = '#writer/${w.id}'">
                        <img src="${w.photo}" alt="${w.name}">
                        <span>${w.name}</span>
                    </div>
                `).join("")}
            </div>

            ${mapHTML}

            <div class="writers-column">
                <h3>&nbsp;</h3>
                ${rightWriters.map(w => `
                    <div class="writer-item" style="border-right: 3px solid ${w.color}; background-color: ${hexToRgba(w.color, 0.1)};" onclick="window.location.hash = '#writer/${w.id}'">
                        <span>${w.name}</span>
                        <img src="${w.photo}" alt="${w.name}">
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    // Re-initialize Google Map after HTML is rebuilt
    initGoogleMap();
}

// --- MAP EVENT WINDOW ---

window.openMapEvent = function (writerId, eventId) {
    const writer = WRITERS.find(w => w.id === writerId);
    const event = writer.events.find(e => e.id === eventId);

    const mapView = document.getElementById("mapView");
    const infoContent = document.getElementById("mapInfoContent");

    mapView.classList.add("active");

    infoContent.innerHTML = `
        <img src="${writer.photo}" style="width:60px;height:60px;border-radius:50%;border:3px solid ${writer.color}">
        <h2 style="color:${writer.color}; margin-top:10px;">${event.title}</h2>
        <div>${event.year} • ${writer.name}</div>
        <p style="margin-top:10px;">${event.description}</p>
    `;
};

window.closeMapEvent = function () {
    document.getElementById("mapView").classList.remove("active");
};

// --- WRITER PROFILE VIEW, EVENT DETAIL, ROUTER remain SAME as your original code ---

function renderWriterProfile(writerId) {
    const writer = WRITERS.find(w => w.id === writerId);
    if (!writer) return renderError("Writer not found");

    app.innerHTML = `
        <header>
            <a href="#" class="logo">WriterMap</a>
            <button class="back-btn" onclick="window.location.hash = '#'">Back to Map</button>
        </header>

        <div class="profile-header">
            <img src="${writer.photo}" class="profile-img" style="border-color:${writer.color}">
            <div class="profile-bio">
                <h1>${writer.name}</h1>
                <p>${writer.bio}</p>
            </div>
        </div>

        <div style="text-align:center;margin-top:2rem;">
            <h3>Իրադարձություններ</h3>
            <ul style="list-style:none;padding:0;">
                ${writer.events.map(e => `
                    <li style="margin:1rem;cursor:pointer;color:${writer.color}" 
                        onclick="window.location.hash='#event/${writer.id}/${e.id}'">
                        ${e.year}: ${e.title}
                    </li>
                `).join("")}
            </ul>
        </div>
    `;
}

function renderEventDetail(writerId, eventId) {
    const writer = WRITERS.find(w => w.id === writerId);
    if (!writer) return renderError("Writer not found");

    const event = writer.events.find(e => e.id === eventId);
    if (!event) return renderError("Event not found");

    app.innerHTML = `
        <header>
            <a href="#" class="logo">WriterMap</a>
            <button class="back-btn" onclick="window.location.hash = '#'">Back</button>
        </header>

        <div class="event-detail" style="border-top:4px solid ${writer.color}">
            <div class="event-meta">
                <span class="event-year" style="color:${writer.color}">${event.year}</span>
                <span>${writer.name}</span>
            </div>
            <h1>${event.title}</h1>
            <p>${event.description}</p>
        </div>
    `;
}

function renderError(msg) {
    app.innerHTML = `<h1>Error</h1><p>${msg}</p><a href="#">Go Home</a>`;
}

// --- ROUTER ---

function initRouter() {
    window.addEventListener("hashchange", handleRoute);
    handleRoute();
}

function handleRoute() {
    const hash = window.location.hash;
    if (!hash || hash === "#") {
        renderHome();
    } else if (hash.startsWith("#writer/")) {
        const writerId = hash.split("/")[1];
        renderWriterProfile(writerId);
    } else if (hash.startsWith("#event/")) {
        const [, writerId, eventId] = hash.split("/");
        renderEventDetail(writerId, eventId);
    }
}

initRouter();
