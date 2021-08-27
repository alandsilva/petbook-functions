let db = {
  users: [
    {
      userId: 'qheyr684943hd',
      email: 'user@email.com',
      handle: 'user',
      createdAt: '2021-08-04T13:06:57.617Z',
      imageUrl: 'image/jsyhssushjyddidnd/osjsgsisvkshvsy',
      bio: "Hello, I'm a cute looking cat with bad attitude",
      location: 'Helsinki, FI',
    },
  ],

  posts: [
    {
      userHandle: 'user',
      userImage: 'image/jsyhssushjyddidnd/osjsgsisvkshvsy',
      body: 'This is the post body',
      createdAt: '2021-08-04T13:06:57.617Z',
      likeCount: 5,
      commentCount: 2,
    },
  ],

  notification: [
    {
      sender: 'user1',
      receiver: 'user2',
      postId: 'lsjbsosubslksbousbsl',
      read: 'true | false',
      type: 'like | comment',
      createdAt: '2021-08-04T13:06:57',
    },
  ],

  comments: [
    {
      userHandle: 'user',
      postId: 'lsjbsosubslksbousbsl',
      body: 'nice one mate!',
      createdAt: '2021-08-04T13:06:57',
    },
  ],
};

let userDetails = {
  credentials: {
    userId: 'qheyr684943hd',
    email: 'user@email.com',
    handle: 'user',
    createdAt: '2021-08-04T13:06:57.617Z',
    imageUrl: 'image/jsyhssushjyddidnd/osjsgsisvkshvsy',
    bio: "Hello, I'm a cute looking cat with bad attitude",
    location: 'Helsinki, FI',
  },

  likes: [
    {
      userHandle: 'user1',
      postId: 'jdhdidinlsus',
    },
    {
      userHandle: 'user3',
      postId: 'jdhdidinlsus',
    },
  ],
};
