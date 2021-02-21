// import and instantiate express
const express = require("express"); // CommonJS import style!
const app = express(); // instantiate an Express object
// we will put some server logic here later...
// export the express app we created to make it available to other modules
module.exports = app;

var SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

const logger = require("morgan");
const morgan = require("morgan"); // middleware for nice logging of incoming HTTP requests
const bodyParser = require("body-parser");
app.use(bodyParser.json()); // decode JSON-formatted incoming POST data
app.use(bodyParser.urlencoded({ extended: true })); // decode url-encoded incoming POST data
app.use(morgan("dev"));

//adding cors to allow the redirecting to work properly
const cors = require('cors');

const allowedOrigins = [
  "http://localhost:3000/",
  "http://192.168.1.28",
  "https://accounts.spotify.com/"
	];

  const corsOptions = {
    origin: (origin, cb)=>{
      // allow requests with no origin
      if(!origin) return cb(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
          const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
          return cb(new Error(msg), false);
      }
      return cb(null, true);
    },  
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
    credentials: true,                // required to pass
    allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  }
  // intercept pre-flight check for all routes
  app.options('*', cors(corsOptions))
  app.use(cors(corsOptions));

  

  app.use((req, res, next) => {
    const origin = req.get('origin');
  
    // TODO Add origin validation
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  
    // intercept OPTIONS method
    if (req.method === 'OPTIONS') {
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
      res.sendStatus(204);
    } else {
      next();
    }
  });


//configure the .env file and then we get the info from it
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
let redirect_uri = process.env.REDIRECT_URI
let client_id = process.env.SPOTIFY_CLIENT_ID

let querystring = require('querystring');
let request = require('request');



app.get('/login' , async (req, res, next) => {
  console.log(redirect_uri);
  console.log(client_id);
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: 'user-read-private user-read-email user-top-read user-follow-modify',
      redirect_uri
    }))
    
})

app.get('/callback', async (req, res, next) => {
  console.log('we got here');
  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  
    console.log(req.header);
  console.log(res.header);
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token
    let uri = process.env.FRONTEND_URI || 'http://localhost:3000/'
    console.log(uri);
    spotifyApi.setAccessToken(access_token);
    res.redirect(uri + '?access_token=' + access_token)
  })
 
})

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/userdata/:accesstoken', function(req, res){
  const token = req.params.accesstoken;
  spotifyApi.setAccessToken(token);
  spotifyApi.getMe()
  .then(function(data) {
    console.log('heres the data', data.body);
    res.json(data);
  }, function(err) {
    console.log('oops:', err);
  });
})

