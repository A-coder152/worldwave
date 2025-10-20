const audio = document.getElementById("audio")
const random_audio_button = document.getElementById("randomButton")
const info_div = document.getElementById("infoDiv")
const lat_input = document.getElementById("latInput")
const long_input = document.getElementById("longInput")
const lat_long_btn = document.getElementById("latLongBtn")
const coord_rotary_div = document.getElementById("coordRotaryDiv")
const station_rotary_div = document.getElementById("stationRotaryDiv")
const volume_rotary_div = document.getElementById("volumeRotaryDiv")
const lat_long_tag = document.getElementById('latLongP')
const station_tag = document.getElementById('stationP')
const volume_tag = document.getElementById('volumeP')
const no_coordinates = document.getElementById('noCoordinates')
const location_button = document.getElementById('getLocationButton')

let all_stations = []
let close_stations = []
let latitude = 0
let longitude = 0
let station_dist = false
let has_been_sorted = false
let can_play = false

function api_request(api, rqdict){
    return fetch(api, rqdict).then(response => {
        if (!response.ok) {
            throw new Error(`error ${response} code ${response.status} caused by request at ${api} for ${rqdict}`)
        }
        return response.json()
    })
}

function clamp(a, max, min){
    return Math.min(max, Math.max(a, min))
}

function updateStation(station, list){
    all_stations = sortByCountry(all_stations)
    let sigma = list.indexOf(station)
    let figma = all_stations.indexOf(station)
    if (coord_rotary_knob.getValue() != figma && can_play) {
        console.log(coord_rotary_knob.getValue(), figma)
        coord_rotary_knob.onletgo(figma)
    }
    audio.src = station.url_resolved
    audio.play().catch((error) => {
        console.log("this guy is broken", error)
        if (error.name === "AbortError") {return}
        if (error.name === "NotAllowedError") {
            info_div.innerHTML = "Please interact with the site so it can play!"
            return
        }
        setTimeout(() => {
            list.splice(sigma, 1)
            if (station_dist) {
                station_rotary_knob.setValue(close_stations.length - list.length + sigma)}
                coord_rotary_knob.onletgo(figma)
            sortByDistance(list, {latitude, longitude})
            updateStation(station_dist ? list[sigma]: list[Math.floor(Math.random() * list.length)], list)
        }, 0)   
    })

    info_div.innerHTML = `
    <p class=${station.name.length > 23? "" : "bigp"}>${station.name}</p>
    <p class=${station.country.length > 23? "" : "bigp"}>${station.country}</p>`
    console.log("up", station)
}

function sortByDistance(sortee, coords) {
    function iloveradians(a){return a * Math.PI / 180}
    function haversine(lat1, long1, lat2, long2){
        const dlat = iloveradians(lat2 - lat1)
        const dlong = iloveradians(long2 - long1)
        let a = Math.sin(dlat / 2) * Math.sin(dlat / 2)
        a += Math.sin(dlong / 2) * Math.sin(dlong / 2) * Math.cos(iloveradians(lat1)) * Math.cos(iloveradians(lat2))
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return c * 6371;
    }

    return sortee.sort((a, b) => {
        const dist_a = a.geo_lat && a.geo_long ? haversine(a.geo_lat, a.geo_long, coords.latitude, coords.longitude) : Infinity
        const dist_b = b.geo_long && b.geo_lat ? haversine(b.geo_lat, b.geo_long, coords.latitude, coords.longitude) : Infinity
        return dist_a - dist_b
    })
}

function sortByCountry(sortee){
    return sortee.sort((a, b) => {
        const country_a = a.country.trim().toLowerCase() || 'ZZZZZZZZ'
        const country_b = b.country.trim().toLowerCase() || 'ZZZZZZZZ'
        return country_a.localeCompare(country_b)
    })
}

function createRotaryKnob(parent, settings){
    let current_degree = 0
    let pointer_down = false

    function normalize(a, min, max) {return (a - min) / (max - min)}
    function lerp(a, max, min) {return min + a * (max - min)}
    function ihateradians(a) {return a / Math.PI * 180}

    function valueToDegrees(a) {return lerp(normalize(clamp(a, settings.max, settings.min), settings.min, settings.max), 180, -180)}
    function degreesToValue(a) {return lerp(normalize(a, -180, 180), settings.max, settings.min)}
    
    function getValue() {return Math.round(degreesToValue(current_degree))}

    const new_knob = document.createElement('div')
    new_knob.className = 'rotary-knob'
    new_knob.style.setProperty("--size", `${settings.size}px`)
    new_knob.setAttribute('role', 'slider')
    new_knob.setAttribute('aria-valuemin', String(settings.min))
    new_knob.setAttribute('aria-valuemax', String(settings.max))

    function render(degree){
        current_degree = clamp(degree, 180, -180)
        new_knob.style.transform = `rotate(${current_degree}deg)`
        settings.changed(Math.round(degreesToValue(current_degree)))
    }

    function onletgo(value){settings.onletgo(value)}

    function setValue(value) {render(valueToDegrees(value))}

    const line = document.createElement('div')
    line.className = 'rotary-knob-line'
    new_knob.appendChild(line)

    const center = document.createElement('div')
    center.className = 'rotary-knob-center'
    new_knob.appendChild(center)

    const dashes = document.createElement('div')
    dashes.className = 'rotary-knob-dash'
    new_knob.appendChild(dashes)

    parent.appendChild(new_knob)

    setValue(settings.value)

    function onPointerDown(e) {
        pointer_down = true
        new_knob.setPointerCapture(e.pointerId)
        e.preventDefault()
        updateMouse(e)
    }

    function onPointerMove(e) {
        if (!pointer_down) return
        updateMouse(e)
    }

    function onPointerUp(e) {
        pointer_down = false
        try {new_knob.releasePointerCapture(e.pointerId)} catch {}
        if (settings.bigboy){
            console.log("bigggg")
            settings.onletgo(degreesToValue(current_degree))
        }
    }

    function updateMouse(e) {
        const rect = new_knob.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        let degree = ihateradians(Math.atan2(dy, dx))
        degree = ((degree + 270) % 360) - 180
        render(degree)
    }

    new_knob.addEventListener('pointerdown', onPointerDown)
    new_knob.addEventListener('pointermove', onPointerMove)
    new_knob.addEventListener('pointerup', onPointerUp)
    new_knob.addEventListener('pointercancel', onPointerUp)

    function byebye(){
        new_knob.removeEventListener('pointerdown', onPointerDown)
        new_knob.removeEventListener('pointermove', onPointerMove)
        new_knob.removeEventListener('pointerup', onPointerUp)
        new_knob.removeEventListener('pointercancel', onPointerUp)
        new_knob.remove()
    }

    return {div: new_knob, getValue, setValue, byebye, onletgo}
}

async function getCloseStations(){
    no_coordinates.textContent = ""
    lat_long_tag.textContent = `(${latitude}, ${longitude})`
    station_dist = true
    close_stations = []
    close_stations = sortByDistance(all_stations, {latitude, longitude}).slice(0, 25)
    
    updateStation(close_stations[0], close_stations)
    console.log(close_stations)
    console.log(close_stations[0])
    station_rotary_knob.setValue(0)
}

function fetch_all_stations(){
    api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true&order=random&limit=100").then(results =>{
        console.log(results)
        all_stations = results
        api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true&order=random").then(results =>{
            console.log(results)
            all_stations = results
            localforage.setItem("allStations", {timestamp: Date.now(), stations: all_stations})
        })
    })
}

async function load_stations(){
    let saved_stations = await localforage.getItem("allStations")
    if (saved_stations && Date.now() < saved_stations.timestamp + 10800000){
        all_stations = saved_stations.stations
    } else {fetch_all_stations()}
    coord_rotary_knob.byebye()
    coord_rotary_knob = createRotaryKnob(coord_rotary_div, {
        min: 0, max: all_stations.length, bigboy: true, value: Math.floor(Math.random() * all_stations.length), size: 300, 
        onletgo: (value) => {
            coord_rotary_knob.setValue(value)
            can_play = true
            const new_station = all_stations[parseInt(value)]
            if (!new_station){
                console.log(all_stations, all_stations[parseInt(value)], value)
                return
            }
            console.log(new_station)
            if (new_station.geo_lat && new_station.geo_long) {
                latitude = Math.round(new_station.geo_lat * 10000) / 10000
                longitude = Math.round(new_station.geo_long * 10000) / 10000
                getCloseStations()
                console.log("bggbfs")
            } else {
                updateStation(new_station, all_stations)
                no_coordinates.textContent = "No coordinates for this radio"
            }
    }, changed: (value) => console.log(value)
    })
    all_stations = sortByCountry(all_stations)
}

load_stations()

random_audio_button.addEventListener("click", () => {
    can_play = true
    station_dist = false
    let chosen_station = all_stations[Math.floor(Math.random() * all_stations.length)]
    updateStation(chosen_station, all_stations)
})

lat_long_btn.addEventListener("click", async () => {
    can_play = true
    latitude = String(clamp(parseFloat(lat_input.value), 90, -90))
    longitude = String(clamp(parseFloat(long_input.value), 180, -180))
    getCloseStations()
})

location_button.addEventListener("click", async () => {
    can_play = true
    navigator.geolocation.getCurrentPosition((position) => {
        latitude = position.coords.latitude
        longitude = position.coords.longitude
        getCloseStations()
    })
})

let coord_rotary_knob = createRotaryKnob(coord_rotary_div, {
    min: 0, max: 100, value: 0, size: 300, 
    changed: (value) => lat_long_tag.textContent = value
})

const station_rotary_knob = createRotaryKnob(station_rotary_div, {
    min: 0, max: 25, value: 0, size: 100, 
    changed: (value) => {
        can_play = true
        station_tag.textContent = `Station #${value + 1}`
        if (close_stations[value]) {updateStation(close_stations[value], close_stations)}
    }
})

const volume_rotary_knob = createRotaryKnob(volume_rotary_div, {
    min: 0, max: 100, value: 50, size: 100, 
    changed: (value) => {
        can_play = true
        audio.volume = value / 100
        volume_tag.textContent = `Volume: ${value}`
    }
})