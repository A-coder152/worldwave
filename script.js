const audio = document.getElementById("audio")
const random_audio_button = document.getElementById("randomButton")
const info_div = document.getElementById("infoDiv")
const lat_input = document.getElementById("latInput")
const long_input = document.getElementById("longInput")
const lat_long_btn = document.getElementById("latLongBtn")
const rotary_div = document.getElementById("rotaryDiv")

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

    return {div: new_knob, getValue, setValue}
}



api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true&order=random&limit=100").then(results =>{
    console.log(results)
    all_stations = results
    api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true&order=random").then(results =>{
        console.log(results)
        all_stations = results
    })
})

random_audio_button.addEventListener("click", () => {
    let chosen_station = all_stations[Math.floor(Math.random() * all_stations.length)]
    updateStation(chosen_station, all_stations)
})

lat_long_btn.addEventListener("click", async () => {
    latitude = String(clamp(parseFloat(lat_input.value), 90, -90))
    longitude = String(clamp(parseFloat(long_input.value), 180, -180))
    close_stations = []
    let while_counter = 0
    do {
        const results = await api_request(`https://all.api.radio-browser.info/json/stations/search?has_geo_info=true&hidebroken=true&geo_lat=${latitude}&geo_long=${longitude}&geo_distance=${Math.pow(10, while_counter + 3)}`)
        close_stations = results
        while_counter += 1
    } while (close_stations.length < 10 && while_counter < 10)
    
    close_stations = sortByDistance(close_stations)
    updateStation(close_stations[0], close_stations)
    console.log(close_stations)
    console.log(close_stations[0])
})

const test_rotary_button = createRotaryKnob(rotary_div, {
    min: 0, max: 100, value: 25, size: 300, 
    changed: (value) => console.log(value)
})