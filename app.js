/* We are using express for this app - import the
 * module here
 */
var express = require('express');
var app = express();
var path = require('path');

/* The view engine for this app is ejs, set that here */
app.set('view engine', 'ejs'); 

/* Set the default routes file to our routes.js file*/
var routes = require('./routes')(app)

/* Set the views directory to public/views */
app.set('views', path.join(__dirname, 'public', 'views'))

/* Set directory to serve static files from */
app.use('/static', express.static(path.join(__dirname, 'public', 'static')))

/* Start the server either on the process port or on
 * port 8888
 */
app.listen(process.env.PORT || 8888, function () {
  console.log('The app is up and running!')
})