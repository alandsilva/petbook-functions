const { db } = require('../utils/admin');
const config = require('../utils/config');
const firebase = require('firebase');
firebase.initializeApp(config);
const {
  validateSignupData,
  validateLoginData,
} = require('../utils/validators');

exports.signup = async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  // Validate data
  const { errors, valid } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

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
};

exports.login = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  // Validate data
  const { errors, valid } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

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
};
