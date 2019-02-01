/* routes.js - this file contains all the routes that we will
 * need for the project. By default, this file is set as the
 * routes file for the project in app.js
 */

/* A file stream module that enables us to read the JSON file */
var fs = require('fs')

/* A module that helps us deal with mutiple asynchronous calls */
var async = require('async');

/* A module that allows us to parse the url of a request to access
 * the parameters
 */
var url = require('url');

/* A module that allows us to parse parameters as JSON */
var queryString = require("querystring");

/* A module that allows us to connect to the Postgres database */
var pg = require('pg');

var connection = "postgresql://postgres:psqlpass@131.215.26.148:5433/eastdb"

var client = new pg.Client(connection)
client.connect();

client.query("SELECT * FROM up_dspace limit 10", function(err, rows) {
	console.log("Success!");
});

module.exports = function(app, passport) {
	/* Set the index page to render index.ejs in public/views */
	app.get('/', function(req, res) {
		/* Renders the index.ejs file while passing in a blank data variable */
		res.render("index.ejs", {
			data: ""
		})
	})

	app.post('/get_sequence', function(req, res) {
		console.log("POST request received - /get_sequence");

		var limit = req.body["limit"]

		var num0 = req.body["num0"]
		var num1 = req.body["num1"]
		var num2 = req.body["num2"]

		var query = "select ids, preds_3dim_0, preds_3dim_1, preds_3dim_2, cube_3d, \'(" + num0 + ", " + num1 + ", " + num2 + ")\'::cube <-> cube_3d as d from sample order by d limit " + limit + ";"
		
		client.query(query, function(err, result) {
			if (err) {
				console.log("Error with post request /get_sequence");
				res.end("Error with post request /get_sequence");
			} else {
				res.end(JSON.stringify(result.rows));
			}
		})
	})

	app.post('/get_sequences', function(req, res) {
		console.log("POST request received - /get_sequences");

		var data = req.body;

		var limit = req.body["limit"]

		var resJson = {}

		var calls = []

		Object.keys(data).forEach(function(key) {
			if (key != "limit") {
				calls.push(function(callback) {
					var num0 = data[key]["num0"]
					var num1 = data[key]["num1"]
					var num2 = data[key]["num2"]

					var query = "select ids, preds_3dim_0, preds_3dim_1, preds_3dim_2, cube_3d, \'(" + num0 + ", " + num1 + ", " + num2 + ")\'::cube <-> cube_3d as d from sample order by d limit " + limit + ";"
			
					console.log(query)

					client.query(query, function(err, result) {
						if (err) {
							console.log("Error with post request /get_sequences");
							res.end("Error with post request /get_sequences");
						} else {
							resJson[key] = result.rows
							callback(null, resJson)
						}
					})
				})
			}
		});

		async.parallel(calls, function(err, results) {
			if (err) {
				console.log("Error making multiple sequences call")
			} else {
				res.end(JSON.stringify(resJson));
				console.log("Successfully dealt with mutliple sequences")
			}
		})

		return
	})
}