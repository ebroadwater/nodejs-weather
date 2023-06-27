const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

const wc = new Map([
	[0, "Clear sky"],
	[1, "Mainly clear"],
	[2, "Partly cloudy"],
	[3, "Overcast"],
	[45, "Fog"],
	[48, "Depositing rime fog"],
	[51, "Light drizzle"],
	[53, "Moderate drizzle"],
	[55, "Dense drizzle"], 
	[56, "Light freezing drizzle"], 
	[57, "Dense freezing drizzle"], 
	[61, "Slight rain"], 
	[63, "Moderate rain"], 
	[65, "Heavy rain"], 
	[66, "Light freezing rain"], 
	[67, "Heavy freezing rain"], 
	[71, "Slight snow fall"], 
	[73, "Moderate snow fall"], 
	[75, "Heavy snow fall"], 
	[77, "Snow grains"], 
	[80, "Slight rain showers"], 
	[81, "Moderate rain showers"], 
	[82, "Violent rain showers"], 
	[85, "Slight snow showers"], 
	[86, "Heavy snow showers"], 
	[95, "Thunderstorm"], 
	[96, "Thunderstorm with slight hail"], 
	[99, "Thunderstorm with heavy hail"]
]);
var isNight = false;
var location = "";

app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res) =>{
	res.render('home', {
		title: 'Real-Time Weather Forecast',
	})
});
//`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=10&language=en&format=json`
async function searchLocation(query){
	const response = await axios.get(
		`https://geocoding-api.open-meteo.com/v1/search?name=${query}`
	);
	return response.data;
}
async function searchWeather(lat, lon){
	const response = await axios.get(
		// `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&hourly=relativehumidity_2m`
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`
	);
	return response.data;
}
/*
We've prefixed the callback function with the async keyword 
so that we may await the results from the searchWeather() method 
before responding to the client request.
*/
app.get('/search', async (req,res) => {
	try{
		const searchQuery = req.query.q;
		if (!searchQuery){
			res.redirect(302, '/');
			return;
		}
		const results = await searchLocation(searchQuery);
		//res.status(200).json(results);
		res.render('search', {
			title: `Real Time Weather Forecast: ${searchQuery}`,
			searchResults: results, 
			searchQuery
		});
	} catch(err){
		next(err);
	}
});

function getTime(){
	var date = new Date();
	var hrs = date.getHours();
	var min = date.getMinutes();
	var time = "AM";

	if (hrs > 17 || hrs < 5){
		isNight = true;
	}
	if (hrs > 12){
		hrs -= 12;
		time = "PM";
	}
	else if (hrs == 0){
		hrs = 12;
	}
	if (min < 10){
		min = "0" + min;
	}
	return hrs + ":" + min + " " + time;
}
function getImage(weathercode){
	if (weathercode == 0){
		if (isNight){
			return "images/night-clear.png";
		}
		return "images/day-sunny.png";
	}
	else if (weathercode < 4){
		return "images/cloudy.png";
	}
	else if (weathercode < 49){
		return "images/fog.png";
	}
	else if (weathercode < 56){
		return "images/sprinkle.png";
	}
	else if (weathercode < 66){
		return "images/rain.png";
	}
	else if (weathercode < 68){
		return "images/rain-mix.png";
	}
	else if (weathercode < 78){
		return "images/snow.png";
	}
	else if (weathercode < 83){
		return "images/showers.png";
	}
	else if (weathercode < 87){
		return "images/snow.png";
	}
	else if (weathercode == 95){
		return "images/thunderstorm.png";
	}
	else if (weathercode < 100){
		return "images/storm-showers.png";
	}
}

app.get('/weather', async (req, res, next) => {
	try{
		const lat = req.query.lat;
		const lon = req.query.lon;

		if (!lat || !lon){
			res.redirect(302, '/');
			return;
		}
		const results = await searchWeather(lat, lon);
		const dateString = getTime();
		const weatherCode = wc.get(results.current_weather.weathercode);
		const img = getImage(results.current_weather.weathercode);
		res.render('weather', {
			title: 'Real Time Weather Forecast',
			searchResults: results,
			date: dateString,
			weathercode: weatherCode, 
			weatherImage:img,
			searchLocation: req.query.n
		});
	} catch(err){
		next(err);
	}
});

/*
"Catch-all" error handler
Doesn't handle async functions 
*/
app.use(function(err, req, res, next) {
	console.error(err);
	res.set('Content-Type', 'text/html');
	res.status(500).send('<h1>Internal Server Error</h1>');
});

const server = app.listen(process.env.PORT || 3000, () => {
	console.log(`Weather Forecast server started on port: ${server.address().port}`);
});
