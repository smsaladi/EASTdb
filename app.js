/* We are using express for this app - import the
 * module here
 */
var express = require('express');
var app = express();

/* The view engine for this app is ejs, set that here */
app.set('view engine', 'ejs'); 

/* Set the default routes file to our routes.js file*/
var routes = require('./routes')(app)

/* Set the views directory to public/views */
app.set('views', __dirname + "/public/views");

/* Start the server either on the process port or on
 * port 8888
 */
app.listen(process.env.PORT || 8888, function () {
  console.log('The app is up and running!')
})