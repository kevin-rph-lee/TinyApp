var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

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
  res.render("urls_index", {
    urls: urlDatabase,
    username: req.cookies["username"]});
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies["username"]});
});


app.get("/urls/:id", (req, res) => {
  res.render("urls_show", {
    urls: urlDatabase,
    shortURL: req.params.id,
    username: req.cookies["username"]
  });
});

app.get("/register", (req, res) => {
  res.render('urls_register');
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.Username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
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