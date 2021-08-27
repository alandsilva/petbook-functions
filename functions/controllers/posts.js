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
        userImage: doc.data().userImage,
        commentCount: doc.data().commentCount,
        likeCount: doc.data().likeCount,
        createdAt: doc.data().createdAt,
      });
    });
    return res.json(posts);
  } catch (err) {
    console.error(err);
  }
};

exports.createPost = async (req, res) => {
  const newPost = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  try {
    const doc = await db.collection('posts').add(newPost);
    const createdPost = newPost;
    createdPost.postId = doc.id;
    res.json({ createdPost });
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

    return res.json(postData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.code });
  }
};

exports.commentPost = async (req, res) => {
  const postDocRef = db.doc(`/posts/${req.params.postId}`);
  const commentColRef = db.collection('comments');
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
    const doc = await postDocRef.get();
    if (!doc.exists) res.status(404).json({ error: 'Posts not found' });

    await postDocRef.update({ commentCount: doc.data().commentCount + 1 });

    await commentColRef.add(newComment);
    res.json(newComment);
  } catch (err) {
    console.log('Error adding commnet!');
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};

exports.likePost = async (req, res) => {
  const likeColRef = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('postId', '==', req.params.postId)
    .limit(1);
  const postDocRef = db.doc(`/posts/${req.params.postId}`);

  let postData = {};
  try {
    let postDoc = await postDocRef.get();
    if (postDoc.exists) {
      postData = postDoc.data();
      postData.postId = postDoc.id;

      let likeCol = await likeColRef.get();
      console.log(likeCol);
      if (likeCol.empty) {
        await db.collection('likes').add({
          postId: req.params.postId,
          userHandle: req.user.handle,
        });

        postData.likeCount++;
        await postDocRef.update({ likeCount: postData.likeCount });
        res.json(postData);
      } else {
        res.status(400).json({ error: 'Scream already liked' });
      }
    } else {
      res.status(404).json({ error: 'Post not found!' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};

exports.unlikePost = async (req, res) => {
  const likeColRef = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('postId', '==', req.params.postId)
    .limit(1);
  const postDocRef = db.doc(`/posts/${req.params.postId}`);

  let postData = {};
  try {
    let postDoc = await postDocRef.get();
    if (postDoc.exists) {
      postData = postDoc.data();
      postData.postId = postDoc.id;

      let likeCol = await likeColRef.get();
      if (likeCol.empty) {
        res.status(404).json({ error: 'Post not liked!' });
      } else {
        console.log(likeCol.docs[0].data().id);
        await db.doc(`likes/${likeCol.docs[0].id}`).delete();
        postData.likeCount--;
        await postDocRef.update({ likeCount: postData.likeCount });
        res.json(postData);
      }
    } else {
      res.status(404).json({ error: 'Post not found!' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};

exports.deletePost = async (req, res) => {
  const postDocRef = db.doc(`/posts/${req.params.postId}`);

  try {
    const postDoc = await postDocRef.get();
    if (!postDoc.exists) {
      res.status(404).json({ error: 'Post not found' });
    }
    if (postDoc.data().userHandle !== req.user.handle) {
      res.status(403).json({ error: 'Unauthorized' });
    } else {
      await postDocRef.delete();
      res.json({ message: 'Post deleted succesfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};
