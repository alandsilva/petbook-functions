const { admin, db } = require('./admin');

const getTokenFrom = (req) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

module.exports = async (req, res, next) => {
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
