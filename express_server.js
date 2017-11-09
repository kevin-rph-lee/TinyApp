const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session');

const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");


//Database of URLS in system
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    owner: '123',
    visited: 0,
    date: '4-12-2011',
    visitors: []
  },

  "9sm5xK": {
    longURL: "http://google.ca",
    owner: '123',
    visited: 0,
    date: '1-3-2043',
    visitors: []
  }

};

//Database of Users in teh system
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

/**
 * Generates a random string 6 characters long
 * @return {string} random string 6 characters long
 */
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i <= 5; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Filters out the DB so it returns only URLs owned by the user
 * @param  {string} id UserID of user whom you want the URLS owned by
 * @return {obj}    DB of URLS owned by that particular user
 */
function urlsForUser(id){
  let urlDatabaseForUser = {};
  for(var url in urlDatabase){
    if (urlDatabase[url].owner === id){
      urlDatabaseForUser[url] = urlDatabase[url];
    }
  }
  return urlDatabaseForUser
}

/**
 * Checks if a use exists in the DB
 * @param  {string} email email to check if it exists
 * @param  {obj} users usersDB
 * @return {boolean}       Returns true if user already exists, false otherwise
 */
function userExists(email, users){
  for (var user in users){
    if (email === users[user].email){
      return true;
    }
  }
  return dup;
}

app.get("/", (req, res) => {
  if(!req.session.user_id){
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});


app.get("/urls", (req, res) => {
  var id = req.session.user_id;
  //to debug urlDatabase: console.log(urlDatabase);
  res.render("urls_index", {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  });
});

app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect('/login');
  } else {
    res.render("urls_new", {
      user: users[req.session.user_id]
    });
  }
});

//Opens login page if not already logged in
app.get("/login", (req, res) => {
  if(!req.session.user_id){
    res.render("urls_login", {
      user: users[req.session.user_id]
    });
  } else {
    res.redirect('/urls');
  }
});

//Page to update the long URL
app.get("/urls/:id", (req, res) => {
  //sends errors if page doesn't exist or if the user is not the owner of the page
  if(urlDatabase[req.params.id] === undefined){
    res.sendStatus(404);
  } else if(urlDatabase[req.params.id].owner !== req.session.user_id || req.session.user_id === undefined){
    res.sendStatus(403);
  } else {
    res.render("urls_show", {
     urls: urlDatabase,
     shortURL: req.params.id,
     user: users[req.session.user_id]
   });
  }
});

app.get("/register", (req, res) => {
  res.render('urls_register');
});

app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL;
  if(urlDatabase[shortURL] === undefined){
    res.status(404).send('Not found!');
  } else {
    urlDatabase[shortURL].visited ++ ;
    if(urlDatabase[shortURL].visitors.indexOf(req.session.user_id) === -1){
      console.log('new visitor!');
      urlDatabase[shortURL].visitors.push(req.session.user_id);
    }
  res.redirect(urlDatabase[shortURL].longURL);
  }
});

app.post("/register", (req, res) => {
  var userID = generateRandomString();
  var email = req.body.email.toLowerCase();
  if (req.body.email.length === 0 || req.body.password === 0){
    res.sendStatus(400);
  } else if(userExists(email, users)){
    res.sendStatus(400);
  } else {
    users[userID] = {
     id: userID,
     email: email,
     password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  for (var user in users){
    console.log('Checking: ' + user + ' value ' + users[user].email);
    console.log('input: ' + req.body.email);
    if (req.body.email.toLowerCase() === users[user].email){
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
  urlDatabase[req.params.id].longURL = req.body.updateURL;
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
    date: date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
    visitors: []
  };
  console.log(urlDatabase);
  res.redirect('/urls/');
});

app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect('/urls/');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});