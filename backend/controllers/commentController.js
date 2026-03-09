const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      post: postId,
      author: req.user.id,
      text
    });

    await comment.save();
    await comment.populate('author', 'username profilePicture');

    post.comments.push(comment._id);
    await post.save();

    res.status(201).json({ message: 'Comment created', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user.id);

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }

    await comment.save();
    res.json({ message: isLiked ? 'Comment unliked' : 'Comment liked', likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const post = await Post.findById(comment.post);
    const isCommentAuthor = comment.author.toString() === req.user.id;
    const isPostOwner = post.author.toString() === req.user.id;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: req.params.commentId }
    });

    await Comment.findByIdAndDelete(req.params.commentId);

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
