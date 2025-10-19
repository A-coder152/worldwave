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

let all_stations = []
let close_stations = []
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
            updateStation(list[0], list)
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