const Post = require('../models/Post');
const Comment = require('../models/Comment');

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
