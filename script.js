const audio = document.getElementById("audio")
const random_audio_button = document.getElementById("randomButton")
const info_div = document.getElementById("infoDiv")
const lat_input = document.getElementById("latInput")
const long_input = document.getElementById("longInput")
const lat_long_btn = document.getElementById("latLongBtn")

let audio_sources = [
    "https://cdn.freesound.org/previews/829/829942_9034501-lq.mp3",
    "https://cdn.freesound.org/previews/829/829707_10956972-lq.mp3",
    "https://cdn.freesound.org/previews/829/829713_12698134-lq.mp3"
]

let stations = []
let latitude = 0
let longitude = 0

function api_request(api, rqdict){
    return fetch(api, rqdict).then(response => {
        if (!response.ok) {
            throw new Error(`error ${res} code ${res.status} caused by request at ${api} for ${rqdict}`)
        }
        return response.json()
    })
}

function updateStation(station){
    audio.src = station.url_resolved
    audio.play()
    info_div.innerHTML = `
    <p>Radio Name: ${station.name}</p>
    <p>Country: ${station.country}</p>`
}

api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true").then(results =>{
    console.log(results)
    stations = results
})

random_audio_button.addEventListener("click", () => {
    let chosen_station = stations[Math.floor(Math.random() * stations.length)]
    updateStation(chosen_station)
})

api_request("https://all.api.radio-browser.info/json/stations/search?limit=10&has_geo_info=true&hidebroken=true&geo_lat=45&geo_long=-80&geo_distance=100000&order=geo_distance").then(results => {
    console.log(results)
})

lat_long_btn.addEventListener("click", () => {
    latitude = lat_input.value
    longitude = long_input.value
    api_request(`https://all.api.radio-browser.info/json/stations/search?limit=10&has_geo_info=true&hidebroken=true&geo_lat=${latitude}&geo_long=${longitude}&geo_distance=100000&order=random`).then(results => {
        console.log(results)
        updateStation(results[Math.floor(Math.random() * results.length)])
})
})