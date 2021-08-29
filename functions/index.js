const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./utils/admin');

const FBAuth = require('./utils/fbAuth');

const cors = require('cors');
app.use(cors());

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
app.get('/users/:userId', getUser);
app.post('/notifications', FBAuth, readNotifications);

exports.api = functions.https.onRequest(app);
exports.createNotificationOnLike = functions.firestore
  .document('likes/{docId}')
  .onCreate(async (snapshot) => {
    let postDocRef = db.doc(`posts/${snapshot.data().postId}`);
    let notificationDocRef = db.doc(`notifications/${snapshot.id}`);
    try {
      let postDoc = await postDocRef.get();
      if (postDoc.exists && postDoc.data().userHandle !== snapshot.userHandle) {
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
      if (postDoc.exists && postDoc.data().userHandle !== snapshot.userHandle) {
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

exports.onUserImageChange = functions.firestore
  .document('/users/{userId}')
  .onUpdate(async (change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('image has changed');
      let batch = db.batch();
      let postsColRef = db
        .collection('posts')
        .where('userHandle', '==', change.before.data().handle);
      try {
        let data = await postsColRef.get();
        data.forEach((doc) => {
          const post = db.doc(`/posts/${doc.id}`);
          batch.update(post, { userImage: change.after.data().imageUrl });
        });
        await batch.commit();
        return;
      } catch (err) {
        console.log(err);
        return;
      }
    }
  });

exports.onPostDeleted = functions.firestore
  .document('/posts/{postId}')
  .onDelete(async (snapshot, context) => {
    const postId = context.params.postId;
    const batch = db.batch();
    const commentsColRef = db
      .collection('comments')
      .where('postId', '==', postId);
    const likesColRef = db.collection('likes').where('postId', '==', postId);
    const notificationsColRef = db
      .collection('notifications')
      .where('postId', '==', postId);
    try {
      let commentsCol = await commentsColRef.get();
      let likesCol = await likesColRef.get();
      let notificationsCol = await notificationsColRef.get();

      commentsCol.forEach((doc) => {
        batch.delete(db.doc(`/comments/${doc.id}`));
      });
      likesCol.forEach((doc) => {
        batch.delete(db.doc(`/likes/${doc.id}`));
      });
      notificationsCol.forEach((doc) => {
        batch.delete(db.doc(`/notifications/${doc.id}`));
      });

      await batch.commit();
      return;
    } catch (err) {
      console.log(err);
      return;
    }
  });
