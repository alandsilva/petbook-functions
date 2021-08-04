const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./utils/fbAuth');

const { getAllPosts, postOnePost } = require('./controllers/posts');
const { signup, login } = require('./controllers/users');

// posts routes
app.get('/posts', getAllPosts);

app.post('/posts', FBAuth, postOnePost);

// users routes
app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.https.onRequest(app);
