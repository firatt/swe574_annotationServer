if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const SESSION_SECRET = "firat"
const ACCESS_TOKEN_SECRET = "b021aa464dc3bb87a47ba61c1e4954cc8fad06a7701ee7ea17cbfdcf91728f62c11eba25abec6d1f5b2fd56236ad9bf6582541dc40305ab00a1a634eb40986b8"

// const db = require("./configs/firebasedb");
const Joi = require('@hapi/joi');
const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');

const session = require('express-session');
const FirebaseStore = require('connect-session-firebase')(session);
// const firebase = require('firebase-admin');

var firebase = require("firebase/app");
require("firebase/database");
var firebaseConfig = {
  apiKey: "AIzaSyAqFb66tOCJOqkdz12WbmNC48ZddqG-mxc",
  authDomain: "sedb-d7f67.firebaseapp.com",
  databaseURL: "https://sedb-d7f67.firebaseio.com",
  projectId: "sedb-d7f67",
  storageBucket: "",
  messagingSenderId: "932053982451",
  appId: "1:932053982451:web:1b1f55df41f0fd54"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// app.use(session({
//     store: new FirebaseStore({
//       database: db
//     }),
//     secret: 'keyboard cat',
//     resave: true,
//     saveUninitialized: true
//   }));

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(flash());
app.use(session({
  // store: new FirebaseStore({
  //   database: db
  // }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(express.static('./views'));

var users = []
// ..4

app.post('/extLogin', getUsers, async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    db.ref("users/").once("value").then((snapshot) => {
      users = snapshot.val();
      var usersArr = Object.keys(users).map((_) => {
        return users[_];
      });
      users = usersArr;
      var currentUser = users.filter((u) => {
        return u.email === username;
      });

      bcrypt.compare(password, currentUser[0].password, function (err, result) {
        if (err) {
          console.log("Bcrypt error: " + err);
        }
        if (result == true) {
          const user = { name: username };
          const accessToken = jwt.sign(user, ACCESS_TOKEN_SECRET);
          return res.json({
            accessToken: accessToken,
            username: currentUser[0].name,
            userid: currentUser[0].id,
            email: currentUser[0].email
          });
        } else {
          return res.json({ message: "Incorrect password" });
        }
      });
    });
  } catch (error) {
    console.log("Login error: " + error);
  }
});

app.get('/extGetPosts', authenticateToken, (req, res) => {

  try {
    db.ref("annotations/").once("value").then((snapshot) => {
      const data = snapshot.val();
      const fbPosts = [];
      keys = Object.keys(data);
      keys.forEach(element => {
        if (typeof data[element].userEmail !== "undefined")
          fbPosts.push(data[element]);
      });
      const userPosts = fbPosts.filter(post => post.userEmail === req.user.name);
      const anonymPosts = fbPosts.filter(post => post.userEmail === "NA");
      const responsePosts = [];
      userPosts.forEach(element => {
        responsePosts.push(element);
      });
      anonymPosts.forEach(element => {
        responsePosts.push(element);
      });

      // console.log(responsePosts);

      res.json(responsePosts);
    });
  } catch (error) {
    console.log(error);
  }

  // res.json(posts.filter(post => post.username === req.user.name));
});

app.get('/', checkAuthenticated, (req, res) => {
  try {
    db.ref("annotations/").once("value").then((snapshot) => {
      annotations = snapshot.val();
      // console.log(annotations);
      const annotationsArr = Object.keys(annotations).map((_) => {
        annotations[_].dbId = _;
        return annotations[_];
      });
      const fileterdForUser = annotationsArr.filter(e => e.userEmail === req.user.email);
      res.render('index.ejs', { name: req.user.name, myArr: fileterdForUser });
    });
  } catch (error) {
    res.render('index.ejs', { name: req.user.name, myArr: [] });

  }

  // res.render('index.ejs', { name: req.user.name, myArr: [1,2,3,4] });
});

app.get('/login', getUsers, checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', getUsers, checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userId = uuidv4();
    db.ref('users/' + uuidv4()).set({
      id: userId,
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
})

// Annotations
app.post('/setAnnotation', (req, res, next) => {
  try {
    const id = uuidv4();
    db.ref('annotations/' + id).set({
      context: req.body['@context'],
      type: req.body.type,
      id: req.body.id,
      userId: req.body.userId,
      target: req.body.target,
      body: req.body.body,
      motivation: req.body.motivation,
      canonical: req.body.canonical,
      userName: req.body.userName,
      userEmail: req.body.userEmail
    });
  } catch (error) {
    console.log(error);
  }
  res.sendStatus(200);
  return next();
});

app.get("/getAnnotation", (req, res, next) => {
  try {
    db.ref("annotations/").once("value").then((snapshot) => {
      res.status(200).send(snapshot.val());
    });
  } catch (error) {
    console.log(error);
  }
  // return next();
});

app.post("/deleteAnnotation", (req, res, next) => {
  try {
    db.ref('annotations/' + req.body.annoId).remove();
    res.sendStatus(200);
  } catch (error) {
    console.log("Annotation deletion error: " + error);
  }
  next();
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

function getUsers(req, res, next) {
  db.ref("users/").once("value").then((snapshot) => {
    users = snapshot.val();
    var usersArr = Object.keys(users).map((_) => {
      return users[_];
    });
    users = usersArr;
    // console.log(users);
    // res.status(200).send(snapshot.val());
  });
  return next();
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    // console.log(req.user);
    next();
  });
};

function checkRegiesteredUser(req, res, next) {
  try {
    db.ref("users/").once("value").then((snapshot) => {
      var registeredUsers = snapshot.val();
      var registeredUsersArr = Object.keys(registeredUsers).map((_) => {
        return registeredUsers[_];
      });
      const f = registeredUsersArr.filter(u => u.email === req.body.email);
      if (f.length > 0) {
        res.render("error.ejs");
      }
    });
  } catch (error) {
    console.log("Error during already registered users check: " + error);
  }
  next();
}

app.listen(process.env.PORT || 3000);