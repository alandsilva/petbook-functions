const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./utils/fbAuth');

const {
  getAllPosts,
  postOnePost,
  getPost,
  postComment,
} = require('./controllers/posts');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getUserDetails,
} = require('./controllers/users');

// posts routes
app.get('/posts', getAllPosts);
app.post('/posts', FBAuth, postOnePost);
app.get('/posts/:postId', getPost);
app.post('/posts/:postId/comment', FBAuth, postComment);

// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getUserDetails);

exports.api = functions.https.onRequest(app);
