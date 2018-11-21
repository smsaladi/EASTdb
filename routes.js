/* routes.js - this file contains all the routes that we will
 * need for the project. By default, this file is set as the
 * routes file for the project in app.js
 */

/* A file stream module that enables us to read the JSON file */
var fs = require('fs')

/* A module that allows us to parse the url of a request to access
 * the parameters
 */
var url = require('url');

module.exports = function(app, passport) {
	/* Set the index page to render index.ejs in public/views */
	app.get('/', function(req, res) {
		/* Renders the index.ejs file while passing in a blank data variable */
		res.render("index.ejs", {
			data: ""
		})
	})

	/* A get request that returns a message to the client */
	app.get('/get_data', function(req, res) {
		/* Renders the index.ejs file while passing a message through the data variable */
		res.render("index.ejs", {
			data: "Successfully received request"
		})
	})

	/* A get request that takes in the ID of a sequence as a parameter and returns
	 * the sequence as a string. As of right now, this route parses sequences out of 
	 * a JSON file
	 */
	app.get('/get_sequence', function(req, res) {
		console.log("GET request received - /get_sequence");

		/* Build the query for the request to access the parameters */
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;

		/* The id of the sequence passes as a parameter */
		var id = req.query.id

		/* Create a JSON object from our sequences file */
		var obj = JSON.parse(fs.readFileSync('sequence_sample.json', 'utf8'));

		/* Loop through every sequence in the JSON object and compare with the id
		 * passes as a parameter. Return the sequence itself as a string if a match 
		 * is found
		 */
		for (var i = 0; i < obj["sequences"].length; i++) {
			if (obj["sequences"][i]["id"] == id) {
				console.log("GET request /get_sequence succeeded - returned sequence");
				res.end(obj["sequences"][i]["seq"])

				return
			}
		}

		/* At this point, no sequence has been found */
		console.log("Error with GET request /get_sequence - no sequence found");
		res.end("Error - sequence not found");
	})
}