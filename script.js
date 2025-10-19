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

let all_stations = []
let close_stations = []
let latitude = 0
let longitude = 0

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
    audio.src = station.url_resolved
    audio.play().catch((error) => {
        console.log("this guy is broken", error)
        if (error.name === "AbortError") {return}
        setTimeout(() => {
            list.splice(list.indexOf(station), 1)
            sortByDistance(list)
            updateStation(station.geo_distance ? list[0]: list[Math.floor(Math.random() * list.length)], list)
        }, 0)   
    })

    info_div.innerHTML = `
    <p>Radio Name: ${station.name}</p>
    <p>Country: ${station.country}</p>`
    console.log(station)
}

function sortByDistance(sortee) {
    return sortee.sort((a, b) => {
        return (a.geo_distance || Infinity) - (b.geo_distance || Infinity) 
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

    return {div: new_knob, getValue, setValue, byebye}
}

function fetch_all_stations(){
    api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true&order=random&limit=100").then(results =>{
        console.log(results)
        all_stations = results
        api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true&order=random").then(results =>{
            console.log(results)
            all_stations = results
            coord_rotary_knob.byebye()
            coord_rotary_knob = createRotaryKnob(coord_rotary_div, {
                min: 0, max: all_stations.length, value: 0, size: 300, 
                changed: (value) => lat_long_tag.textContent = value
            })
            localforage.setItem("allStations", {timestamp: Date.now(), stations: all_stations})
        })
    })
}

async function load_stations(){
    let saved_stations = await localforage.getItem("allStations")
    if (saved_stations && Date.now() < saved_stations.timestamp + 7200000){
        all_stations = saved_stations.stations
    } else {fetch_all_stations()}
}

load_stations()

random_audio_button.addEventListener("click", () => {
    let chosen_station = all_stations[Math.floor(Math.random() * all_stations.length)]
    updateStation(chosen_station, all_stations)
})

lat_long_btn.addEventListener("click", async () => {
    latitude = String(clamp(parseFloat(lat_input.value), 90, -90))
    longitude = String(clamp(parseFloat(long_input.value), 180, -180))
    close_stations = []
    const results = await api_request(`https://all.api.radio-browser.info/json/stations/search?has_geo_info=true&hidebroken=true&geo_lat=${latitude}&geo_long=${longitude}&geo_distance=10000000`)
    close_stations = results
    
    close_stations = sortByDistance(close_stations)
    updateStation(close_stations[0], close_stations)
    console.log(close_stations)
    console.log(close_stations[0])
})

let coord_rotary_knob = createRotaryKnob(coord_rotary_div, {
    min: 0, max: 100, value: 0, size: 300, 
    changed: (value) => lat_long_tag.textContent = value
})

const station_rotary_knob = createRotaryKnob(station_rotary_div, {
    min: 0, max: 25, value: 0, size: 100, 
    changed: (value) => console.log(value)
})

const volume_rotary_knob = createRotaryKnob(volume_rotary_div, {
    min: 0, max: 100, value: 50, size: 100, 
    changed: (value) => {
        audio.volume = value / 100
        volume_tag.textContent = `Volume: ${value}`
    }
})