import express from 'express';
import http from 'http';
import fetch from 'node-fetch';
import cookieSession from 'cookie-session';
import cors from 'cors';

var whitelist = ['https://marvelous-centaur-4ff8ce.netlify.app']; //white list consumers
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true, //Credentials are cookies, authorization headers or TLS client certificates.
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'device-remember-token', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
};


const cookieSessionOptions = {
  name: "__session",
  keys: [process.env.COOKIEKEY],
  sameSite: 'none', // Required for cross-site cookies
  maxAge: 1000 * 60 * 60 * 24, // 1 day
  partitioned: true, // Add the Partitioned attribute
  cookie: {
    httpOnly: true,
    secure: true,
  }
};


const app = express();

app.set('trust proxy', 1) // trust first proxy
app.use(cookieSession(cookieSessionOptions));
app.use(cors(corsOptions));
app.set('port', process.env.PORT || 3001);
app.use(express.json());

app.get('/healthz', function(req, res) {
  res.send('ok');
});

app.get('/login', function (req, res) {
  const authEndpoint = 'https://github.com/login/oauth/authorize';
  const redirectData = {
    client_id: process.env.CLIENT_ID,
    redirect_uri: 'https://marvelous-centaur-4ff8ce.netlify.app',
    scope: ['repo']
  };
  const searchParams = new URLSearchParams(redirectData);
  if (!req.session.token) {
    res.json({
      url: `${authEndpoint}?${searchParams.toString()}`
    });
  }
});

app.get('/token', function (req, res) {
  if (!req.query || req.query === null || req.query === {}) {
    res.status(406).send('code is required');
    return
  }
  const code = req.query.code;
  if (!code || code == null || code === "" || code.length === 0) {
    res.status(406).send('code is required');
    return
  }
  const githubURL = 'https://github.com/login/oauth/access_token';
  const getTokenData = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  };
  getTokenData.code = code;
  const searchParams = new URLSearchParams(getTokenData);
  const getTokenURL = `${githubURL}?${searchParams}`;
  fetch(getTokenURL, {
    method: 'POST',
    headers: {
      Accept: 'application/json'
    }
  }).then((r) => {
    if (r.status != 200) {
      console.error(r.headers);
      res.status(500).send('failed to authenticate on behalf of user');
      return;
    }
    return r.json();
  }).then((data) => {
    const token = data.access_token;
    req.session.token = token;
    res.status(200).json({ message: 'Session set' });
  }).catch((err) => {
    console.error(err);
    res.status(500).send('failed to authenticate on behalf of user');
  });
});

app.get('/auth', function (req, res) {
  if (req.session.token === undefined || !req.session.token || req.session.token === '') {
    res.status(401).send('unauthorized');
    return;
  }
  res.status(200).send('ok');
});

// /repositories is going to return a list of repositories
// associated with the user. The github repository does not
// return a response that includes how many pages there are.
// fetch all of the users repositories until we hit something we already have seen. cache the result and call it done.
app.post("/repositories", async function (req, res) {
  // TODO: figure out how to use middleware for this.
  if (req.session.token === undefined || !req.session.token || req.session.token === '') {
    res.status(401).send('unauthorized');
    return;
  }
  let sentRepositories = req.body.repositories;
  let page = req.session.page;
  if (page === undefined || Object.keys(sentRepositories).length === 0) {
    req.session.page = 0;
    page = req.session.page;
  }
  let userRepositoriesForCall = {};
  const token = req.session.token;
  const searchParams = new URLSearchParams({
    per_page: 100,
    page,
    sort: 'pushed',
  });
  const opts = {
    headers: makeHeaders(token),
  }
  let response = await fetch('https://api.github.com/user/repos?' + searchParams.toString(),opts)
  if (!response.ok) {
    console.error(`failed to get user repos with ${response.status}`)
    res.status(500).json(userRepositoriesForCall);
    return
  }
  let data = await response.json();
  let seen = false;

  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    if (sentRepositories !== undefined && item.id in sentRepositories) {
      seen=true;
      continue
    }
    userRepositoriesForCall[item.id] = item.full_name
  }
  if (!seen) {
    req.session.page += 1; // add a page if the thing isn't seen
  } else {
    req.session.page = 0; // restart it again.
  }
  res.status(200).json(userRepositoriesForCall);
  return
});

app.get("/workflows", async function (req, res) {
  // TODO: figure out how to use middleware for this.
  if (req.session.token === undefined || !req.session.token || req.session.token === '') {
    console.log('sent unauthorized request to repositories');
    res.status(401).send('unauthorized');
    return;
  }
  const token = req.session.token;
  const repoName = req.query.repoName;
  const searchParams = new URLSearchParams({
    "per_page": 100,
  });
  const response = await fetch(`https://api.github.com/repos/${repoName}/actions/workflows?`+searchParams.toString(), {
    headers:  makeHeaders(token)
  });
  if (!response.ok) {
    console.error(`failed to get workflows with ${response.status}`);
    res.status(500).send();
    return
  }
  let data = await response.json();
  if (data.total_count === 0) {
    res.status(203).send();
    return
  }
  let retMap = {};
  for (let i = 0; i < data.workflows.length; i++) {
    let item=data.workflows[i];
    retMap[item.name] = item.id
  }
  res.json(retMap);
});

app.post('/runs', async function(req, res) {
  if (!req.session || !req.session.token) {
    res.status(401).send('unauthorized');
    return;
  }
  const token = req.session.token;
  const repository = req.body.repository;
  const workflowID = req.body.workflowID;
  const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflowID}/runs`,
    {
      headers: makeHeaders(token)
    }
  )
  if (!response.ok) {
     console.log(response, 'this is broken')
     res.status(500).send('failed to fetch runs for workflow');
  }
  const workflowStatus = await response.json();
  const getJobs = fetchJobWithToken(token); const promises = workflowStatus.workflow_runs.map(getJobs);
  const jobStatus = await Promise.allSettled(promises);
  const failureCount = {};
  const jobBreakDown = jobStatus.map((resObj) => {
    const nonSkippedResults = {
      passed: [],
      failed: []
    };
    for (let i = 0; i < resObj.value.jobs.length; i++) {
      const job = resObj.value.jobs[i];
      if (job.conclusion === 'success') {
        nonSkippedResults.passed.push({
          name: job.name,
          conclusion: job.conclusion
        });
      } else if (job.conclusion === 'failure') {
        nonSkippedResults.failed.push({
          name: job.name,
          conclusion: job.conclusion
        });
        if (!(job.name in failureCount)) {
          failureCount[job.name] = 0;
        }
        failureCount[job.name] += 1;
      }
    }
    if (resObj.value.jobs[0] !== undefined) {
      return {
        jobResults: nonSkippedResults,
        id: resObj.value.jobs[0].run_id,
        date: resObj.value.jobs[0].started_at.split('T')[0]
      };
    }
    return {
      jobResults: nonSkippedResults,
      id: '1111111111',
      date: null,
    };
  });
  res.status(200).json({
    jobBreakDown,
    failureCount
  });
});

function fetchJobWithToken(token) {
  return async function fetchJobData(jobObject) {
    const response = await fetch(jobObject.jobs_url + "?per_page=100", {
      headers: makeHeaders(token),
    });
    if (response.status === 200) {
      return await response.json();
    }
  };
}

function makeHeaders (token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
