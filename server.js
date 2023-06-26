const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

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
			title: 'Search results for: ${searchQuery}',
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

app.get('/weather', async (req, res, next) => {
	// const lat = req.query.lat;
	// const lon = req.query.lon;

	// if (!lat && !lon) {
	//   res.redirect(302, '/');
	//   return;
	// }
	// const results = await searchWeather(lat, lon);
	// //res.status(200).json(results);
	// res.status(200).json(results.hourly);


	try{
		const lat = req.query.lat;
		const lon = req.query.lon;

		if (!lat || !lon){
			res.redirect(302, '/');
			return;
		}
		const results = await searchWeather(lat, lon);
		//const dateNow = new Date();
		//const dateString = dateNow.getHours() + ":" + dateNow.getMinutes();
		const dateString = getTime();

		res.render('weather', {
			title: 'Search results for: ${lat}, ${lon}',
			searchResults: results,
			//timezone: weather.timezone,
			// elevation: results.elevation, 
			// currentWeather: results.current_weather,
			// hourlyUnits: results.hourly_units,
			// hourly: results.hourly, 
			// dailyUnits: results.daily_units, 
			// daily: results.daily, 
			date: dateString,
		});
	} catch(err){
		next(err);
	}


	// try{
	// 	const lat = req.query.lat;
	// 	const lon = req.query.lon;
	// 	if (!lat || !lon){
	// 		res.redirect(302, '/');
	// 		return;
	// 	}
	// 	const results = await searchWeather(lat, lon);
	// 	//res.status(200).json(results);
	// 	res.render('weather', {
	// 		title: 'Search results for: ${searchQuery}',
	// 		searchResults: results
	// 	});
	// } catch(err){
	// 	next(err);
	// }
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
