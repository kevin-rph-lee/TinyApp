const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");


const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);



const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    owner: '123',
    visited: 0,
    date: '4-12-2011'
  },

  "9sm5xK": {
    longURL: "http://google.ca",
    owner: '123',
    visited: 0,
    date: '1-3-2043'
  }

};

const users = {
  "123": {
    id: "123",
    email: "admin@ll.com",
    password: bcrypt.hashSync('peerVue', 10)
  },
  "324": {
    id: "324",
    email: "user@ll.com",
    password: bcrypt.hashSync('peerVue', 10)
  }
};



function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i <= 5; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function urlsForUser(id){
  let urlDatabaseForUser = {};
  for(var url in urlDatabase){
    if (urlDatabase[url].owner === id){
      urlDatabaseForUser[url] = urlDatabase[url];
    }
  }
  return urlDatabaseForUser
}


app.get("/", (req, res) => {
  if(req.session.user_id === undefined){
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  var id = req.session.user_id;
  console.log(urlDatabase);
  res.render("urls_index", {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  });
});

app.get("/urls/new", (req, res) => {
  if(req.session.user_id === undefined){
    res.redirect('/login');
  } else {
    res.render("urls_new", {
      user: users[req.session.user_id]
    });
  }
});

app.get("/login", (req, res) => {
  if(req.session.user_id === undefined){
    res.render("urls_login", {
      user: users[req.session.user_id]
    });
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls/:id", (req, res) => {

  res.render("urls_show", {
    urls: urlDatabase,
    shortURL: req.params.id,
    user: users[req.session.user_id]
  });
});

app.get("/register", (req, res) => {
  res.render('urls_register');
});

app.post("/register", (req, res) => {
  var userID = generateRandomString();
  var dup = false;

  for (var user in users){
    console.log('Checking: ' + user + ' value ' + users[user].email);
    console.log('input: ' + req.body.email);
    if (req.body.email === users[user].email){
      dup = true;
    }
  }

  if (req.body.email.length === 0 || req.body.password === 0){
    res.sendStatus(400);
  } else if (dup === true){
    res.sendStatus(400);
  } else {
    users[userID] = {
     id: userID,
     email: req.body.email,
     password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  console.log(req.body.email);
  console.log(req.body.password);

  for (var user in users){
    console.log('Checking: ' + user + ' value ' + users[user].email);
    console.log('input: ' + req.body.email);
    if (req.body.email === users[user].email){
      if (bcrypt.compareSync(req.body.password, users[user].password)){
        req.session.user_id = users[user].id;
        res.redirect('/urls');
      } else {
        res.sendStatus(403);
      }
    }
  }
  res.sendStatus(403);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.updateURL;
  res.redirect('/urls/');
});

app.post("/urls", (req, res) => {
  var ran = generateRandomString();
  var date = new Date();
  urlDatabase[ran] = {
    id: ran,
    longURL: req.body['longURL'],
    owner: req.session.user_id,
    visited: 0,
    date: date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear()
  };
  console.log(urlDatabase);  // debug statement to see POST parameters
  res.redirect('/urls/');         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect('/urls/');         // Respond with 'Ok' (we will replace this)
});



app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL;
  if(urlDatabase[shortURL] === undefined){
    res.status(404).send('Not found!');
  } else {
    urlDatabase[shortURL].visisted ++;
    res.redirect(urlDatabase[shortURL].longURL);
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});