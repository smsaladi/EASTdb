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

/* A module that allows us to parse parameters as JSON */
var queryString = require("querystring");

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
		 * passed as a parameter. Return the sequence itself as a string if a match 
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

	/* A get request to get a single sequence from 3 numbers passed as separate parameters.
	 * Return value type is a string, not JSON
	 */
	app.get('/get_sequence_from_numbers', function(req, res) {
		console.log("GET request received - /get_sequence_from_numbers");

		/* Build the query for the request to access the parameters */
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;

		/* The numbers of the sequence passed as parameters */
		var num1 = req.query.num1
		var num2 = req.query.num2
		var num3 = req.query.num3

		/* Create a JSON object from our sequences file */
		var obj = JSON.parse(fs.readFileSync('sequence_sample.json', 'utf8'));

		/* Loop through every sequence in the JSON object and compare with the numbers
		 * passed as a parameter. Return the sequence itself as a string if a match 
		 * is found
		 */
		for (var i = 0; i < obj["sequences"].length; i++) {
			if (obj["sequences"][i]["num1"] == num1 &&
				obj["sequences"][i]["num2"] == num2 &&
				obj["sequences"][i]["num3"] == num3) {

				console.log("GET request /get_sequence succeeded - returned sequence");

				/* Return the sequence as a string */
				res.end(obj["sequences"][i]["seq"])

				return
			}
		}

		/* At this point, no sequence has been found */
		console.log("Error with GET request /get_sequence_from_numbers - no sequence found");
		res.end("Error - sequence not found");

		return
	})

	/* A get request to get a list of sequences from multiple lists of 3 numbers
	 * passed as parameters in JSON format. Returns the list of sequences in
	 * JSON format, instead of as strings
	 */
	app.get('/get_sequences_from_numbers', function(req, res) {
		console.log("GET request received - /get_sequence_from_numbers");

		/* Build the query for the request to access the parameters */
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;

		/* The parameters are passed as a json object rather than a string, so
		 * we need to parse the numbers list into a json object here
		 */
		var numbersJson = JSON.parse(query["numbers"])

		/* Create a JSON object from our sequences file */
		var obj = JSON.parse(fs.readFileSync('sequence_sample.json', 'utf8'));

		/* Create a sequences json object to return, which we will populate in the 
		 * following for loop
		 */
		var sequences = {

		}

		/* Loop through every sequence in the JSON object and compare with the numbers
		 * passed as parameters from each item in the numbersJson object. If a match is
		 * found, add the sequence itself into the sequences json object
		 *
		 * Note - I am using Object.keys(numbersJson).length to determine the size of
		 * our json object, and will do this to determine the lengths of all json objects
		 * in this function
		 */
		for (var i = 0; i < obj["sequences"].length; i++) {
			for (var j = 0; j < Object.keys(numbersJson).length; j++) {
				if (obj["sequences"][i]["num1"] == numbersJson[j]["num1"] &&
					obj["sequences"][i]["num2"] == numbersJson[j]["num2"] &&
					obj["sequences"][i]["num3"] == numbersJson[j]["num3"]) {

					/* Add the sequence with the appropriate key to our sequences object */
					sequences[Object.keys(sequences).length] = obj["sequences"][i]["seq"]
				}
			}
		}

		/* At this point, no sequence has been found */
		console.log("Request ended - /get_sequences_from_numbers")

		/* Return the sequences object as a string */
		res.end(JSON.stringify(sequences));

		return
	})
}