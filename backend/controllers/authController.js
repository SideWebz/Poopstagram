const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('followers', 'username _id')
      .populate('following', 'username _id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, profilePicture } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, bio, profilePicture },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('_id username email profilePicture followers following')
      .limit(10)
      .exec();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username _id')
      .populate('following', 'username _id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    console.log('FOLLOW REQUEST:', {
      targetUserId: userId,
      currentUserId: currentUserId,
      idMatch: userId === currentUserId
    });

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const userToFollow = await User.findById(userId);

    if (!currentUser) {
      console.log('Current user not found:', currentUserId);
      return res.status(404).json({ message: 'Current user not found' });
    }

    if (!userToFollow) {
      console.log('Target user not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following - compare as strings
    const alreadyFollowing = currentUser.following.some(id => id.toString() === userId);
    console.log('Already following:', alreadyFollowing);
    
    if (alreadyFollowing) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to current user's following list
    currentUser.following.push(userId);
    // Add current user to target user's followers list
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    console.log('FOLLOW SUCCESS:', {
      follower: currentUserId,
      following: userId,
      currentUserNewFollowing: currentUser.following,
      targetUserNewFollowers: userToFollow.followers
    });

    res.json({ 
      message: 'Followed successfully',
      following: currentUser.following
    });
  } catch (error) {
    console.error('FOLLOW ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    console.log('UNFOLLOW REQUEST:', {
      targetUserId: userId,
      currentUserId: currentUserId
    });

    const currentUser = await User.findById(currentUserId);
    const userToUnfollow = await User.findById(userId);

    if (!currentUser) {
      console.log('Current user not found:', currentUserId);
      return res.status(404).json({ message: 'Current user not found' });
    }

    if (!userToUnfollow) {
      console.log('Target user not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Before unfollow:', {
      currentUserFollowing: currentUser.following,
      targetUserFollowers: userToUnfollow.followers
    });

    // Remove from current user's following list
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    // Remove current user from target user's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await userToUnfollow.save();

    console.log('UNFOLLOW SUCCESS:', {
      unfollower: currentUserId,
      unfollowing: userId,
      currentUserNewFollowing: currentUser.following,
      targetUserNewFollowers: userToUnfollow.followers
    });

    res.json({ 
      message: 'Unfollowed successfully',
      following: currentUser.following
    });
  } catch (error) {
    console.error('UNFOLLOW ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('followers', 'username email profilePicture _id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('following', 'username email profilePicture _id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
