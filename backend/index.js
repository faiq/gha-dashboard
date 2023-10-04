import express from "express";
import http from "http";
import bodyParser from "body-parser";
import fetch from 'node-fetch';

const app = express()
const githubURL = "https://github.com/login/oauth/access_token"

let data = {
  "client_id": process.env.CLIENT_ID,
  "client_secret": process.env.CLIENT_SECRET
}

app.set('port', process.env.PORT || 3001);
app.use(bodyParser.json());

app.get('/getToken', function (req, res) {
  console.log("get token was called");
  let code = req.query.code;
  data["code"] = code;
  const searchParams = new URLSearchParams(data);
  const getTokenURL = `${githubURL}?${searchParams}`
  fetch(getTokenURL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
    }
  }).then((r) => {
    return r.json();
  }).then((data) => {
    console.log(data);
    res.json(data);
  }).catch((err) => {
      console.log("got error ", err);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
