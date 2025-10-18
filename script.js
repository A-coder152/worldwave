const audio = document.getElementById("audio")
const random_audio_button = document.getElementById("randomButton")

function api_request(api, rqdict){
    return fetch(api, rqdict).then(response => {
        if (!response.ok) {
            throw new Error(`error ${res} code ${res.status} caused by request at ${api} for ${rqdict}`)
        }
        return response.json()
    })
}

let audio_sources = [
    "https://cdn.freesound.org/previews/829/829942_9034501-lq.mp3",
    "https://cdn.freesound.org/previews/829/829707_10956972-lq.mp3",
    "https://cdn.freesound.org/previews/829/829713_12698134-lq.mp3"
]

let stations = []

api_request("https://all.api.radio-browser.info/json/stations?hidebroken=true").then(results =>{
    console.log(results)
    stations = results
})

random_audio_button.addEventListener("click", () => {
    let chosen_station = stations[Math.floor(Math.random() * stations.length)]
    audio.src = chosen_station.url_resolved
    audio.play()
})