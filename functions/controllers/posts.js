const { db } = require('../utils/admin');

exports.getAllPosts = async (req, res) => {
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
};

exports.postOnePost = async (req, res) => {
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
};

exports.getPost = async (req, res) => {
  let postData = {};

  try {
    const doc = await db.doc(`/posts/${req.params.postId}`).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Post not found' });
    }
    console.log(postData);
    postData.postId = doc.id;

    const comments = await db
      .collection('comments')
      .where('postId', '==', req.params.postId)
      .orderBy('createdAt', 'desc')
      .get();
    postData.comments = [];
    comments.forEach((commentDoc) => {
      return postData.comments.push(commentDoc.data());
    });

    return res.json({ postData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.code });
  }
};

exports.postComment = async (req, res) => {
  if (req.body.body.trim() === '')
    res.status(400).json({ error: 'Must not be empry' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    postId: req.params.postId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  try {
    const doc = await db.doc(`/posts/${req.params.postId}`).get();
    if (!doc.exists) res.status(404).json({ error: 'Posts not found' });

    await db.collection('comments').add(newComment);
    res.json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};
