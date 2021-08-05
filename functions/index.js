const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./utils/fbAuth');

const {
  getAllPosts,
  createPost,
  getPost,
  commentPost,
  likePost,
  unlikePost,
  deletePost,
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
app.post('/posts', FBAuth, createPost);
app.get('/posts/:postId', getPost);
app.delete('/posts/:postId', FBAuth, deletePost);
app.post('/posts/:postId/comment', FBAuth, commentPost);
app.get('/posts/:postId/like', FBAuth, likePost);
app.get('/posts/:postId/unlike', FBAuth, unlikePost);

// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getUserDetails);

exports.api = functions.https.onRequest(app);
