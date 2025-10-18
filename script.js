const audio = document.getElementById("audio")
const random_audio_button = document.getElementById("randomButton")

function api_request(api, rqdict){
    return fetch(api, rqdict).then(response => {
        if (!response.ok) {
            throw new Error(`error ${res} code ${res.status} caused by request at ${api} for ${rqdict}`)
        }
        return response.json
    }).then(thingy => {
        return thingy
    }).catch(problem => {
        console.log(problem)
    })
}

let audio_sources = [
    "https://cdn.freesound.org/previews/829/829942_9034501-lq.mp3",
    "https://cdn.freesound.org/previews/829/829707_10956972-lq.mp3",
    "https://cdn.freesound.org/previews/829/829713_12698134-lq.mp3"
]

random_audio_button.addEventListener("click", () => {
    audio.src = audio_sources[Math.floor(Math.random() * audio_sources.length)]
    audio.play()
})

// setTimeout(() => {
//     audio.play()
// }, 3000)
