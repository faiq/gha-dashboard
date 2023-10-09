import express from "express";
import http from "http";
import bodyParser from "body-parser";
import fetch from 'node-fetch';
import session  from 'express-session'
import cors from 'cors'

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 
};

const sessionOptions = {
  secret: process.env.SESSION_ID_SECRET || 'iamabanana',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } //only for dev purpose
};

const app = express();
const githubURL = "https://github.com/login/oauth/access_token";

app.set('port', process.env.PORT || 3001);
app.use(bodyParser.json());
app.use(session(sessionOptions));
app.use(cors(corsOptions));

const authEndpoint = "https://github.com/login/oauth/authorize"
const redirectData = {
  "client_id": process.env.CLIENT_ID,
  "redirect_uri": "http://localhost:3000/",
  "scope": ["repo"]
}
const searchParams = new URLSearchParams(redirectData);

app.get('/login', function (req, res) {
  if (!req.session.token) {
    res.json({
      url: `${authEndpoint}?${searchParams.toString()}`
    });
  }
});

let getTokenData = {
  "client_id": process.env.CLIENT_ID,
  "client_secret": process.env.CLIENT_SECRET
};

app.get('/token', function (req, res) {
  let code = req.query.code;
  getTokenData["code"] = code;
  const searchParams = new URLSearchParams(getTokenData);
  const getTokenURL = `${githubURL}?${searchParams}`;
  fetch(getTokenURL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
    },
    
  }).then((r) => {
    if (r.status != 200) {
      console.error(r.headers);
      res.status(500).send('failed to authenticate on behalf of user');
      return
    }
    return r.json();
  }).then((data) => {
    let token = data.access_token;
    req.session.token = token;
    res.send(req.session.sessionID);
  }).catch((err) => {
    console.error(err)
    res.status(500).send('failed to authenticate on behalf of user');
  });
})

app.get("/auth", function(req, res) {
  if (!req.session.token) {
    res.status(401).send('unauthorized');
    return
  }
  res.status(200).send('ok');
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
