// Haversine implementation adapted from example by Sonia Rode via Google Maps Platform documentaiton, Nov 7 2019
// https://mapsplatform.google.com/resources/blog/how-calculate-distances-map-maps-javascript-api/
function haversine_distance(a, b) {
      var R = 6371.0710; // Radius of the Earth in km
      var latA =  a.latitude * (Math.PI/180);
      var latB =  b.latitude * (Math.PI/180);
      var latDiff = latB - latA; // Radian difference (latitudes)
      var lonDiff = (b.longitude - a.longitude) * (Math.PI/180); // Radian difference (longitudes)
      var d = 2 * R * Math.asin(Math.sqrt(Math.sin(latDiff/2)*Math.sin(latDiff/2)+Math.cos(latA)*Math.cos(latB)*Math.sin(lonDiff/2)*Math.sin(lonDiff/2)));
      return d;
}

class gpsRanger {
    #destinations = [];
    onRangeUpdate;
    onArrive;
    #arrivedAt;
    #watchID = -1;
    skipButton;

    // TODO: add success handler (switch permissions to content, begin querying updates).
    // TODO: add distance update handler.

    constructor(enableButton, skipButton, onEnable, onError, onRangeUpdate, onArrive) {
        this.onRangeUpdate = onRangeUpdate;
        this.onArrive = onArrive;
        this.skipButton = skipButton;

        skipButton.addEventListener('click', () => {
            if (this.#watchID === -1) {
                enableButton.classList.add('hidden');
                onEnable();
            }
            this.arrive(undefined);
        });

        const startGPS = () => {
            
            if (this.#watchID !== -1) {
                console.log(`Error: there's already a watchPosition in progress.`);
                return;
            }
            enableButton.classList.add('hidden');
            this.#watchID = navigator.geolocation.watchPosition(this.onGeoUpdate.bind(this), onError, {maximumAge: 2000, timeout: 5000, enableHighAccuracy: true} );
            onEnable();
        };

        if ('geolocation' in navigator) {
            enableButton.addEventListener('click', startGPS)
            navigator.permissions.query({name: 'geolocation'}).then((result) => {
                if (result.state === 'granted') {
                    startGPS();
                }
            });
        } else {
            enableButton.innerText = "GPS Unavailable";
            enableButton.setAttribute("disabled", "disabled");        
        }
    }

    arrive(destination) {
        this.#arrivedAt = destination;
        if (!this.onArrive || this.onArrive(destination)) {
            this.skipButton.classList.add('hidden');
            
            if (this.#watchID != -1)
                navigator.geolocation.clearWatch(this.#watchID);
        }
    }

    onGeoUpdate(geodata) {
        if (!this.#destinations) return;

        const pos = geodata.coords;
        let minDistance = Infinity;
        let closest = null;
        for (const dest of this.#destinations) {
            const range = haversine_distance(pos, dest) * 1000.0; // Distance in m
            if (range < minDistance) {
                closest = dest;
                minDistance = range;
            }
        }
        this.onRangeUpdate(minDistance, closest);

        if (closest && minDistance <= closest.tolerance && this.#arrivedAt !== closest) {
            this.arrive(closest);
        }
    }

    setDestination(latlong) {
        if (!latlong.tolerance) latlong.tolerance = 7;
        this.#destinations = [latlong];
    }

    /*
    setDestinations(list) {
        // TODO: support multiple destinations.
    }
    */
}

export {gpsRanger};

/*  Saved from earlier experiment with map plotting.
        const pos = {lat: 43.466987, long: -79.698890};
        const pointer = document.getElementById('pointer');
        const mapImage = document.getElementById('map-image');
        const coordsout = document.getElementById('coords');

        function inverseLerp(min, max, value) {
            return (value - min) / (max - min);
        }

        function updatePointer() {
            const leftLong = -79.711679;
            const topLat = 43.472983;
            const rightLong = -79.692153;
            const bottomLat = 43.464854;

            const xRel = inverseLerp(leftLong, rightLong, pos.long);
            const yRel = inverseLerp(topLat, bottomLat, pos.lat);

            const rect = mapImage.getBoundingClientRect();
            const parent = pointer.parentElement.getBoundingClientRect();
            
            pointer.style.left = `${xRel * rect.width + rect.left}px`;
            pointer.style.top = `${yRel * rect.height + rect.top}px`;

            coordsout.innerText = `(${pos.lat}, ${pos.long})`;

            requestAnimationFrame(updatePointer);
        }
        requestAnimationFrame(updatePointer);

        (()=>{
            gpsbutton = document.getElementById('enable-gps');

            function geoSuccess(geopos) {
                console.log(geopos);
                pos.lat = geopos.coords.latitude;
                pos.long = geopos.coords.longitude;
            }

            function geoError(errorInfo) {
                console.log('Geolocation error:', errorInfo);
            }

            function startGPS() {
                if ('geolocation' in navigator) {
                    navigator.geolocation.watchPosition(geoSuccess, geoError);
                    gpsbutton.classList.add('hidden');
                } else {
                    console.log('Geolocation API not available.');
                }
            }
            gpsbutton.addEventListener('click', startGPS);

            // Init function.
            navigator.permissions.query({name: 'geolocation'}).then((result) => {
                if (result.state === 'granted') {
                    startGPS();
                } else if (result.state === 'prompt') {
                    gpsbutton.classList.remove('hidden');
                }
            });


        })();
    */