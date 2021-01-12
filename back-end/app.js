// import and instantiate express
const express = require("express"); // CommonJS import style!
const app = express(); // instantiate an Express object
// we will put some server logic here later...
// export the express app we created to make it available to other modules
module.exports = app;

const cors = require("cors");
const logger = require("morgan");
const bodyParser = require("body-parser");
app.use(bodyParser.json()); // decode JSON-formatted incoming POST data
app.use(bodyParser.urlencoded({ extended: true })); // decode url-encoded incoming POST data

let redirect_uri = process.env.REDIRECT_URI || 'http://localhost:8888/callback';



app.get('/login', function(req, res) {
    console.log('login function entered');
    var scopes = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + process.env.SPOTIFY_CLIENT_ID +
      (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
      '&redirect_uri=' + encodeURIComponent(redirect_uri));
    });

