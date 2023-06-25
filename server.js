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
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&hourly=relativehumidity_2m`
	);
	return response.data;
}
/*
We've prefixed the callback function with the async keyword 
so that we may await the results from the searchWeather() method 
before responding to the client request.
*/

/*
Need to get lat and lon of specific place
Use API: https://open-meteo.com/en/docs/geocoding-api#name=06488
*/
/*
1) Get latitude and longitude of location
2) Get metadata from that location :  https://api.weather.gov/points/{lat},{lon}
3) Find properties object inside JSON document, and inside that find the forecast property containing a URL
	(can also get hourly forecast with forecastHourly property)
4) Get JSON document from that URL 
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

app.get('/weather', async (req, res) => {
	const lat = req.query.lat;
	const lon = req.query.lon;

	if (!lat && !lon) {
	  res.redirect(302, '/');
	  return;
	}
	
	const results = await searchWeather(lat, lon);
	res.status(200).json(results);
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
