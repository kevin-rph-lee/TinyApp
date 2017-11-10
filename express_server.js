const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur";
const hashedPassword = bcrypt.hashSync(password, 10);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000
}));
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
    date: '1-3-2016',
    visitors: []
  }
};

//Database of Users in the system
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
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i <= 5; i++){
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
  for(let url in urlDatabase){
    if (urlDatabase[url].owner === id){
      urlDatabaseForUser[url] = urlDatabase[url];
    }
  }
  return urlDatabaseForUser;
}

/**
 * Checks if a use exists in the DB
 * @param  {string} email email to check if it exists
 * @param  {obj} users usersDB
 * @return {boolean}       Returns true if user already exists, false otherwise
 */
function userExists(email, users){
  for (let user in users){
    if (email === users[user].email){
      return true;
    }
  }
  return false;
}

/**
 * Given an array of visitors, checks if the userid exists within it
 * @param  {array} visitors array of visitors within a URL
 * @param  {string} userid   userid of user
 * @return {boolean}          returns true if the user already exists within the array, false if not
 */
function checkNewVisistor(visitors, userid){
  return visitors.indexOf(userid) === -1;
}

app.get("/", (req, res) => {
  if(!req.session.user_id){
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

//Main page which shows all of the short URL's that the user owns
app.get("/urls", (req, res) => {
  console.log(users);
  const { user_ID } = req.session;
  //to debug urlDatabase: console.log(urlDatabase);
  res.render("urls_index", {
    urls: urlsForUser(user_ID),
    user: users[user_ID]
  });
});

//If logged in, shows the create new shortURL page
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
  const { user_ID } = req.session;
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
  if(!urlDatabase[req.params.id]){
    res.sendStatus(404);
  } else if((!req.session.user_id) || (urlDatabase[req.params.id].owner !== req.session.user_id)){
    res.sendStatus(403);
  } else {
    res.render("urls_show", {
      urls: urlDatabase,
      shortURL: req.params.id,
      user: users[req.session.user_id]
    });
  }
});

//Registration page
app.get("/register", (req, res) => {
  res.render('urls_register');
});

//Will redirect to the long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //Check to see if the short URL exists in the DB
  if(!urlDatabase[shortURL]){
    res.status(404);
  } else {
    //increments the visitor counter and if the visistor is unique will add the visitor within the url object
    urlDatabase[shortURL].visited ++ ;
    if(checkNewVisistor(urlDatabase[shortURL].visitors, req.session.user_id)){
      console.log('new visitor!');
      urlDatabase[shortURL].visitors.push(req.session.user_id);
    }
    res.redirect(urlDatabase[shortURL].longURL);
  }
});

//Registers a new user into the system
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email.toLowerCase().trim();
  //Checking to ensure the email and password are not empty
  if (req.body.email.length === 0 || req.body.password.length === 0){
    res.sendStatus(400);
    //Checks if user exists
  } else if(userExists(email, users)){
    res.sendStatus(400);
  } else {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      users[userID] = {
        id: userID,
        email,
        password: hash
      };
    req.session.user_id = userID;
    res.redirect('/urls');
    });
  }
});

//Logs the user into the system
app.post("/login", (req, res) => {
  for (let user in users){
    //Checking if the user exists
    if (req.body.email.toLowerCase().trim() === users[user].email){
      //Checking if password matches what we have in the DB
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

//Logs out by knocking out the cookie session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//Updates the longURL to the new one provided by the user
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.updateURL;
  res.redirect('/urls/');
});

//Generates a new short URL in the URL database
app.post("/urls", (req, res) => {
  //creating the random ID string
  const ran = generateRandomString();
  //Generating the created date of the shortURL
  const date = new Date();
  urlDatabase[ran] = {
    id: ran,
    longURL: req.body['longURL'],
    owner: req.session.user_id,
    visited: 0,
    date: date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
    visitors: []
  };
  res.redirect('/urls/');
});

//Deletes the shortURL from the DB
app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect('/urls/');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});