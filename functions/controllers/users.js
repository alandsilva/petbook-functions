const { db, admin } = require('../utils/admin');
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

  //Set imageUrl
  const noImage = 'no-image.png';

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
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

exports.uploadImage = (req, res) => {
  const Busboy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new Busboy({ headers: req.headers });
  let imageFileName;
  let imageToBeUploaded;

  busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    console.log(
      'File [' +
        fieldname +
        ']: filename: ' +
        filename +
        ', encoding: ' +
        encoding +
        ', mimetype: ' +
        mimetype
    );

    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submited' });
    }

    file.on('data', function (data) {
      console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
    });
    file.on('end', function () {
      console.log('File [' + fieldname + '] Finished');
    });

    const imageExtension = filename.split('.').pop();
    imageFileName = `${Math.round(Math.random() * 10000000)}.${imageExtension}`;
    const filepath = await path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = { filepath, mimetype };
    await file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('finish', async () => {
    try {
      await admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        });

      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
      await db.doc(`/users/${req.user.handle}`).update({ imageUrl: imageUrl });
      return res.json({ message: 'Image uploaded succesfully' });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: err.code });
    }
  });

  busboy.end(req.rawBody);
};
