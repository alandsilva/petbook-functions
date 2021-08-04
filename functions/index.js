const admin = require('firebase-admin');
admin.initializeApp();
const firebase = require('firebase');
const functions = require('firebase-functions');
const { user } = require('firebase-functions/lib/providers/auth');
const app = require('express')();
const db = admin.firestore();

var firebaseConfig = {
  apiKey: 'AIzaSyCgaoJoBN5LYbYAf3dS-DozdbFhqEm05y4',
  authDomain: 'petbook-cb3c1.firebaseapp.com',
  projectId: 'petbook-cb3c1',
  storageBucket: 'petbook-cb3c1.appspot.com',
  messagingSenderId: '349464845179',
  appId: '1:349464845179:web:13c4baa899b48e6bac3bde',
  measurementId: 'G-CNLP4WLE7F',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Token handlers
const getTokenFrom = (req) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

const FBAuth = async (req, res, next) => {
  let idToken = getTokenFrom(req);
  if (idToken == null) return res.status(403).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    console.log(decodedToken);
    const data = await db
      .collection('/users')
      .where('userId', '==', req.user.uid)
      .limit(1)
      .get();
    req.user.handle = data.docs[0].data().handle;
    return next();
  } catch (err) {
    console.error('Error while veryfying token', err);
    return res.status(403).json(err);
  }
};

app.get('/posts', async (req, res) => {
  let posts = [];
  try {
    const data = await db
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .get();
    data.forEach((doc) => {
      posts.push({
        postId: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt,
      });
    });
    return res.json(posts);
  } catch (err) {
    console.error(err);
  }
});

app.post('/posts', FBAuth, async (req, res) => {
  const newPost = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
  };

  try {
    const doc = await db.collection('posts').add(newPost);
    res.json({ message: `document ${doc.id} created successfully` });
  } catch (err) {
    res.status(500).json({ error: 'something went wrong' });
    console.error(err);
  }
});

const isEmpty = (string) => {
  if (string.trim() === '') return true;
  else return false;
};

const isEmail = (email) => {
  const emailRegEx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

// Signup route
app.post('/signup', async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  // Validate data
  let errors = {};
  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address';
  }
  if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = 'Passwords must match';
  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  let token;
  let userId;
  try {
    const userDoc = await db.doc(`/users/${newUser.handle}`).get();
    if (userDoc.exists) {
      return res.status(400).json({ handle: 'this handle is already taken' });
    } else {
      const data = await firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
      userId = data.user.uid;
      token = await data.user.getIdToken();
      // return res.status(201).json({ token });

      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId,
      };

      await db.doc(`/users/${newUser.handle}`).set(userCredentials);
      return res.status(200).json({ token });
    }
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      return res.status(400).json({ email: 'Email is already in use' });
    } else {
      return res.status(500).json({ error: err.code });
    }
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};
  if (isEmpty(user.email)) errors.email = 'Must not be empty';
  if (isEmpty(user.password)) errors.password = 'Must not be empty';
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  try {
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password);
    const token = await data.user.getIdToken();
    return res.json({ token });
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/wrong-password') {
      return res
        .status(403)
        .json({ general: 'Wrong credentials, please try again' });
    } else {
      return res.status(500).json({ error: err.code });
    }
  }
});

exports.api = functions.https.onRequest(app);
