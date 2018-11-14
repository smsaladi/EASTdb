/* routes.js - this file contains all the routes that we will
 * need for the project. By default, this file is set as the
 * routes file for the project in app.js
 */

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
}