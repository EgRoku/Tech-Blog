const router = require('express').Router();
const { User, Post, Comment } = require('../models');

// add comments
router.post('/post/:id', async (req, res) => {
  try {
    const newComment = {
      content: req.body.content,
      creator: req.session.username,
      post_id: req.params.id,
    }
    await Comment.create(newComment);
    res.redirect(`/post/${req.params.id}`); 
  } catch (err) {
    res.status(500).send(err);
  }
});

// create new posts
router.post('/dashboard', async (req, res) => {
  try {
    const newPost = {
      title: req.body.title,
      content: req.body.content,
      creator: req.session.username,
    }
    await Post.create(newPost);
    res.redirect(`/dashboard`);
  } catch (err) {
    res.status(500).send(err);
  }
});

// update existing posts
router.put('/post/:id/edit', async (req, res) => {
  try {
    await Post.update(
      {
        title: req.body.title,
        content: req.body.content,
      },
      {
        where: {
          id: req.params.id,
          creator: req.session.username,
        },
      }
    );
    // go back to post that was just edited
    res.redirect(`/post/${req.params.id}`); 
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete post
router.delete('/post/:id/edit', async (req, res) => {
  try {
    // makes sure only owner of post can delete it
    await Post.destroy({
      where: {
        id: req.params.id,
        creator: req.session.username, 
      }
    });
    // redirects to dashboard
    res.redirect('/dashboard'); 
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// login handler
router.post('/login', async (req, res) => {

  if (req.body.loginuser) {
    try {
      const dbUserData = await User.findOne({
        where: {
          username: req.body.loginuser,
        }
      });
  
      if (!dbUserData) {
        res
        .status(400)
        .json('Incorrect username or password. Please try again!');
      return;
      }
  
      const validPassword = await dbUserData.checkPassword(req.body.loginpassword);
  
      if (!validPassword) {
        res
          .status(400)
          .send('Incorrect username or password. Please try again!');
        return;
      }
  
      req.session.save(() => {
        req.session.loggedIn = true;
        req.session.username = dbUserData.username;
        res.redirect('/dashboard');
      });
    } catch (err) {
      console.log(err);
    }
  } else if (req.body.signupuser) { 
    const newUser = {
      username: req.body.signupuser,
      password: req.body.signuppassword
    }
    try {
      await User.create(newUser);
      req.session.save(() => {
        req.session.loggedIn = true;
        req.session.username = newUser.username;
        res.redirect('/dashboard');
      });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') { 
        res
        .status(400)
        .send('Username already exists! Please try again.');
      } else if (err.name === 'SequelizeValidationError') { 
        res
        .status(400)
        .send('Password must be at least 8 characters long.');
      } else {
        res
          .status(400)
          .send(err);
      }
      return;
    }
  }
});

router.post('/logout', (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.status(204).end();
    });
    res.redirect('/');
  } else {
    res.status(404).end();
  }
});

module.exports = router;