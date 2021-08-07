const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./utils/admin');

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
  getUser,
  readNotifications,
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
app.get('/user/:userId', getUser);
app.post('/notifications', FBAuth, readNotifications);

exports.api = functions.https.onRequest(app);
exports.createNotificationOnLike = functions.firestore
  .document('likes/{docId}')
  .onCreate(async (snapshot) => {
    let postDocRef = db.doc(`posts/${snapshot.data().postId}`);
    let notificationDocRef = db.doc(`notifications/${snapshot.id}`);
    try {
      let postDoc = await postDocRef.get();
      if (postDoc.exists) {
        await notificationDocRef.set({
          sender: snapshot.data().userHandle,
          receiver: postDoc.data().userHandle,
          postId: postDoc.id,
          read: false,
          type: 'like',
          createdAt: new Date().toISOString(),
        });
        return;
      }
    } catch (err) {
      console.error(err);
      return;
    }
  });
exports.deleteNotificationOnUnlike = functions.firestore
  .document('likes/{docId}')
  .onDelete(async (snapshot) => {
    let notificationDocRef = db.doc(`notifications/${snapshot.id}`);
    try {
      await notificationDocRef.delete();
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  });

exports.createNotificationOnComment = functions.firestore
  .document('comments/{docId}')
  .onCreate(async (snapshot) => {
    let postDocRef = db.doc(`posts/${snapshot.data().postId}`);
    let notificationDocRef = db.doc(`notifications/${snapshot.id}`);
    try {
      let postDoc = await postDocRef.get();
      if (postDoc.exists) {
        await notificationDocRef.set({
          sender: snapshot.data().userHandle,
          receiver: postDoc.data().userHandle,
          postId: postDoc.id,
          read: false,
          type: 'comment',
          createdAt: new Date().toISOString(),
        });
        return;
      }
    } catch (err) {
      console.error(err);
      return;
    }
  });
