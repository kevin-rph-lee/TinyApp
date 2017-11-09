var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");


const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);


function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i <= 5; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "123": {
    id: "123",
    email: "admin@tinyapp.com",
    password: "gofuckyourself"
  }
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  var id = req.cookies["user_id"];
  console.log(users[req.cookies["user_id"]]);
  res.render("urls_index", {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  });
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {
    user: users[req.cookies["user_id"]]
  });
});

app.get("/login", (req, res) => {
  res.render("urls_login", {
    user: users[req.cookies["user_id"]]
  });
});

app.get("/urls/:id", (req, res) => {
  res.render("urls_show", {
    urls: urlDatabase,
    shortURL: req.params.id,
    user: users[req.cookies["user_id"]]
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
    res.cookie('user_id', userID);
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
        res.cookie('user_id', users[user].id);
        res.redirect('/urls');
      } else {
        res.sendStatus(403);
      }
    }
  }
  res.sendStatus(403);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.updateURL;
  res.redirect('/urls/');
});

app.post("/urls", (req, res) => {
  var ran = generateRandomString();
  urlDatabase[ran] = req.body['longURL'];
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
  if(urlDatabase[shortURL] !== undefined){
    res.redirect(urlDatabase[shortURL]);
  } else {
    res.status(404).send('Not found!');
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});