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
