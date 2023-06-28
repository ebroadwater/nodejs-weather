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
const daysOfWeek = new Map([
	[0, "Sunday"], 
	[1, "Monday"], 
	[2, "Tuesday"], 
	[3, "Wednesday"], 
	[4, "Thursday"], 
	[5, "Friday"], 
	[6, "Saturday"]
]);
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

function convertHrsMins(hrs, mins){
	if (hrs < 10){
		hrs = "0" + hrs;
	}
	if (mins < 10){
		mins += "0";
	}
	return "T" + hrs + ":" + mins;
}
function convertHour(hr){
	var time = "AM";
	if (hr > 12){
		hr -= 12;
		time = "PM";
	}
	else if (hr == 0){
		hr = 12;
	}
	return hr + time;
}
function getTime(date){
	var hrs = date.getHours();
	var min = date.getMinutes();
	var time = "AM";

	if (hrs > 12){
		time = "PM";
		hrs -= 12;
	}
	else if (hrs == 0){
		hrs = 12;
	}
	if (min < 10){
		min = min + "0";
	}
	return hrs + ":" + min + " " + time;
}
function getImage(weathercode, isDay){
	if (weathercode == 0){
		if (isDay){
			return "images/day-sunny.png";
		}
		return "images/night-clear.png";
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
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index,is_day&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`
	);
	return response.data;
}
async function searchHourly(lat, lon){
	const response = await axios.get(
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weathercode,pressure_msl,surface_pressure,cloudcover,visibility,windspeed_10m,uv_index,is_day&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`
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
app.get('/weather', async (req, res, next) => {
	try{
		const lat = req.query.lat;
		const lon = req.query.lon;

		if (!lat || !lon){
			res.redirect(302, '/search');
			return;
		}
		const results = await searchWeather(lat, lon);
		const dateString = getTime(new Date());
		const weatherCode = wc.get(results.current_weather.weathercode);
		const img = getImage(results.current_weather.weathercode, results.current_weather.is_day);
		res.render('weather', {
			title: 'Current Forecast',
			searchResults: results,
			date: dateString,
			weathercode: weatherCode, 
			weatherImage:img,
			searchLocation: req.query.n, 
			searchLocationSecond: req.query.n1
		});
	} catch(err){
		next(err);
	}
});
app.get('/daily', async (req, res, next) => {
	try{
		const lat = req.query.lat;
		const lon = req.query.lon;

		if (!lat || !lon){
			res.redirect(302, '/weather');
			return;
		}
		const results = await searchWeather(lat, lon);
		const weatherCodes = [];
		const imgs = [];
		const dates = [];
		const actualDate = [];
		const sunset = [];
		const sunrise = [];

		for (var i = 0; i < results.daily.weathercode.length; i++){
			weatherCodes[i] = wc.get(results.daily.weathercode[i]);
			imgs[i] = getImage(results.daily.weathercode[i], true);

			var temp = results.daily.time[i];
			var dateParts = temp.split('-');
			var d = new Date(dateParts[0], dateParts[1]-1, dateParts[2]);
			actualDate[i] = temp;
			dates[i] = daysOfWeek.get(d.getDay()) + ",  " + dateParts[1] + "/" + dateParts[2] + "/" + dateParts[0];

			var sunriseDate = new Date(results.daily.sunrise[i]);
			var sunsetDate = new Date(results.daily.sunset[i]);
			sunset[i] = getTime(sunsetDate);
			sunrise[i] = getTime(sunriseDate);
		}
		res.render('daily', {
			title: 'Daily Forecast',
			searchResults: results,
			weatherCodeList: weatherCodes, 
			weatherImageList:imgs,
			dateList: dates,
			acutalDateList: actualDate,
			sunsetList: sunset, 
			sunriseList: sunrise,
			searchLocation: req.query.n, 
			searchLocationSecond: req.query.n1
		});
	} catch(err){
		next(err);
	}
});
app.get('/hourly', async (req, res, next) => {
	try{
		const lat = req.query.lat;
		const lon = req.query.lon;

		if (!lat || !lon){
			res.redirect(302, '/weather');
			return;
		}
		const results = await searchHourly(lat, lon);
		const weatherCodes = [];
		const imgs = [];
		const hrs = [];

		const actualDate = req.query.d;
		const d = new Date(actualDate);
		const d1 = new Date(results.current_weather.time);
		d.setHours(d1.getHours());
		d.setMinutes(d1.getMinutes());
		const dateString = actualDate + convertHrsMins(d.getHours(), d.getMinutes());
		const sIndex = results.hourly.time.indexOf(dateString);

		const dTitle = daysOfWeek.get(d1.getDay()) + ", " + (parseInt(d1.getMonth())+1) + "/" + d1.getDate() + "/" + d1.getFullYear();

		for (var i = 0; i < results.hourly.time.length; i++){
			weatherCodes[i] = wc.get(results.hourly.weathercode[i]);
			imgs[i] = getImage(results.hourly.weathercode[i], results.hourly.is_day[i]);
			hrs[i] = convertHour(i);
		}
		res.render('hourly', {
			title: 'Current Forecast',
			searchResults: results,
			weatherCodeList: weatherCodes, 
			weatherImageList:imgs,
			hours: hrs,
			startIndex: sIndex,
			dateTitle: dTitle,
			searchLocation: req.query.n, 
			searchLocationSecond: req.query.n1
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
