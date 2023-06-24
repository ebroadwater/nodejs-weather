const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res) =>{
	res.render('home', {
		title: 'Real-Time Weather Forecast',
	})
});

const server = app.listen(process.env.PORT || 3000, () => {
	console.log(`Weather Forecast server started on port: ${server.address().port}`);
});
