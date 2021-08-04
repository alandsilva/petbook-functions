const { db } = require('../utils/admin');

exports.getAllScreams = async (req, res) => {
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
