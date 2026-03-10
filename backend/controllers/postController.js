const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Helper function to calculate streak
const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get last post date at midnight
    const lastPostDate = user.lastPostDate ? new Date(user.lastPostDate) : null;
    if (lastPostDate) {
      lastPostDate.setHours(0, 0, 0, 0);
    }

    // If they posted today, don't update
    if (lastPostDate && lastPostDate.getTime() === today.getTime()) {
      return;
    }

    // If last post was yesterday, increment streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastPostDate && lastPostDate.getTime() === yesterday.getTime()) {
      user.streak += 1;
    } else if (!lastPostDate || lastPostDate.getTime() < yesterday.getTime()) {
      // If no post yesterday (or older), reset streak to 1
      user.streak = 1;
    }

    user.lastPostDate = new Date();
    await user.save();
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

exports.createPost = async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const post = new Post({
      author: req.user.id,
      imageUrl,
      caption: caption || ''
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    // Update user streak
    await updateStreak(req.user.id);

    res.status(201).json({ message: 'Post created', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      posts,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalPosts: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.deleteMany({ post: req.params.postId });
    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.ratePost = async (req, res) => {
  try {
    const { score } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ message: 'Score must be between 0 and 100' });
    }

    const existingRating = post.ratings.findIndex(r => r.user.toString() === req.user.id);

    if (existingRating > -1) {
      post.ratings[existingRating].score = score;
    } else {
      post.ratings.push({
        user: req.user.id,
        score
      });
    }

    await post.save();

    const averageScore = post.ratings.length > 0
      ? Math.round(post.ratings.reduce((sum, r) => sum + r.score, 0) / post.ratings.length)
      : 0;

    res.json({
      message: 'Post rated',
      averageScore,
      totalRatings: post.ratings.length,
      userRating: score
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBestPostToday = async (req, res) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all posts from today
    const postsToday = await Post.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    if (postsToday.length === 0) {
      return res.json({ message: 'No posts today', post: null });
    }

    // Calculate average rating for each post and find the best one
    let bestPost = null;
    let bestAverage = -1;

    postsToday.forEach(post => {
      const average = post.ratings.length > 0
        ? Math.round(post.ratings.reduce((sum, r) => sum + r.score, 0) / post.ratings.length)
        : 0;

      // Only consider posts with ratings
      if (post.ratings.length > 0 && average > bestAverage) {
        bestAverage = average;
        bestPost = post;
      }
    });

    if (!bestPost) {
      return res.json({ message: 'No rated posts today', post: null });
    }

    const averageScore = Math.round(bestPost.ratings.reduce((sum, r) => sum + r.score, 0) / bestPost.ratings.length);

    res.json({
      post: bestPost,
      averageScore,
      totalRatings: bestPost.ratings.length,
      message: 'Best shit of the day'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
