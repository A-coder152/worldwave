# worldwave

"radio signals from all over the world, at the turn of your dial"

## how 2 use
the middle thing is a dashboard, shows you what radio station is being played and which country it's from

the big dial to your left contains all the stations ever, sorted by country. Turn it around and.. it plays stuff. lol

most stations dont have a location (blame the api), if it does have a location your location will be updated. 

To update your location, you can:

- put in any lat/long you want (that is valid)
- put in a location name (city preferred) and it will update coords to that location (or try to)
- just do random radios till one has a location lol

the station knob switches stations to other stations near your coordinates.

the volume knob... controls.. uhh volume lol

anyway that's probably it for the controls have fun listening to whatever radio you want
## apis I crashed and are probably going to give me a "friendly visit" soon
radio browser api to fetch the radio stations (all the station data is stored on indexeddb cause too big for localstorage.. fetches all stations once every 3 hours. I used to have it for distance but the api is too fried to work reliably)

openstreetmap nominatim api to doxx people (get lat/long based on city, and vice versa)
## final notes
oh my god javascript sucks
