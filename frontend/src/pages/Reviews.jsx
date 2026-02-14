import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MessageSquare, Trash2, Send, X, Plus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Reviews = () => {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [newPost, setNewPost] = useState({ movieTitle: '', content: '', rating: 5, anonymous: false });
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchPosts();

        // Listen for profile icon changes to refresh posts
        const handleRefresh = () => {
            fetchPosts();
        };

        window.addEventListener('postsNeedRefresh', handleRefresh);

        return () => {
            window.removeEventListener('postsNeedRefresh', handleRefresh);
        };
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const profileIcon = newPost.anonymous ? '👤' : (currentUser.profileIcon || '👤');
            await api.post('/posts', {
                email: currentUser.email,
                movieTitle: newPost.movieTitle,
                content: newPost.content,
                rating: newPost.rating,
                anonymous: newPost.anonymous,
                profileIcon: profileIcon
            });

            setNewPost({ movieTitle: '', content: '', rating: 5, anonymous: false });
            setShowCreatePost(false);
            fetchPosts();
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const handleEditPost = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/posts/${editingPost.id}`, {
                email: currentUser.email,
                movieTitle: editingPost.movieTitle,
                content: editingPost.content,
                rating: editingPost.rating
            });

            setEditingPost(null);
            fetchPosts();
        } catch (error) {
            console.error('Error editing post:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`, {
                data: { email: currentUser.email }
            });
            fetchPosts();
            setSelectedPost(null);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleAddComment = async (postId) => {
        if (!newComment.trim()) return;
        try {
            const profileIcon = currentUser.profileIcon || '👤';
            await api.post(`/posts/${postId}/comments`, {
                email: currentUser.email,
                content: newComment,
                profileIcon: profileIcon
            });

            setNewComment('');
            fetchPosts();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleEditComment = async (postId, commentId, newContent) => {
        try {
            await api.put(`/posts/${postId}/comments/${commentId}`, {
                email: currentUser.email,
                content: newContent
            });

            setEditingComment(null);
            fetchPosts();
        } catch (error) {
            console.error('Error editing comment:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            await api.delete(`/posts/${postId}/comments/${commentId}`, {
                data: { email: currentUser.email }
            });

            fetchPosts();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-text dark:text-white mb-2">Movie Reviews</h1>
                        <p className="text-text/70 dark:text-gray-400">Share your thoughts and read what others think</p>
                    </div>
                    <button
                        onClick={() => setShowCreatePost(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Plus size={20} />
                        New Review
                    </button>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <motion.div
                            key={post.id}
                            layout
                            className="bg-surface rounded-xl border border-white/10 overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
                            onClick={() => setSelectedPost(post)}
                        >
                            {/* Movie Poster */}
                            {post.moviePoster && (
                                <div className="relative bg-black/90 flex items-center justify-center" style={{ height: '450px' }}>
                                    <img
                                        src={post.moviePoster}
                                        alt={post.movieTitle}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
                                        <span className="text-[#fc1723] font-bold text-lg">★</span>
                                        <span className="text-sm font-semibold text-[#fc1723]">{post.rating}/5</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xl flex-shrink-0">
                                        {post.profileIcon || '👤'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-text dark:text-white mb-1">{post.movieTitle}</h3>
                                        {post.movieYear && (
                                            <p className="text-xs text-text/50 dark:text-gray-500 mb-1">({post.movieYear})</p>
                                        )}
                                        <p className="text-sm text-text/60 dark:text-gray-400">
                                            {post.anonymous ? 'Anonymous' : post.author}
                                        </p>
                                    </div>
                                    {!post.moviePoster && (
                                        <div className="flex items-center gap-1 bg-primary/20 px-2 py-1 rounded-lg">
                                            <span className="text-[#fc1723] font-bold">★</span>
                                            <span className="text-sm font-semibold text-text dark:text-white">{post.rating}/5</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-text/80 dark:text-gray-300 text-sm line-clamp-3 mb-4">{post.content}</p>
                                <div className="flex items-center gap-4 text-xs text-text/60 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <MessageSquare size={14} />
                                        {post.comments?.length || 0} comments
                                    </span>
                                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-text/60 dark:text-gray-400 text-lg">No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                )}

                {/* Create Post Modal */}
                <AnimatePresence>
                    {showCreatePost && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
                            onClick={() => setShowCreatePost(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-surface rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-text dark:text-white">Create Review</h2>
                                    <button onClick={() => setShowCreatePost(false)} className="text-text/60 hover:text-text dark:text-gray-400 dark:hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreatePost}>
                                    <div className="mb-4">
                                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Movie Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newPost.movieTitle}
                                            onChange={(e) => setNewPost({ ...newPost, movieTitle: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-text dark:text-white focus:outline-none focus:border-primary"
                                            placeholder="Enter movie title"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewPost({ ...newPost, rating: star })}
                                                    className={`text-3xl transition-all ${star <= newPost.rating ? 'text-[#fc1723]' : 'text-text/20 dark:text-gray-600'}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Your Review</label>
                                        <textarea
                                            required
                                            value={newPost.content}
                                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-text dark:text-white focus:outline-none focus:border-primary resize-none"
                                            rows="5"
                                            placeholder="Share your thoughts about this movie..."
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newPost.anonymous}
                                                onChange={(e) => setNewPost({ ...newPost, anonymous: e.target.checked })}
                                                className="w-4 h-4 text-primary bg-background border-white/10 rounded focus:ring-primary"
                                            />
                                            <span className="text-sm text-text/70 dark:text-gray-400">Post anonymously</span>
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 rounded-lg transition-colors"
                                    >
                                        Post Review
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Edit Post Modal */}
                <AnimatePresence>
                    {editingPost && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
                            onClick={() => setEditingPost(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-surface rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-text dark:text-white">Edit Review</h2>
                                    <button onClick={() => setEditingPost(null)} className="text-text/60 hover:text-text dark:text-gray-400 dark:hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleEditPost}>
                                    <div className="mb-4">
                                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Movie Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={editingPost.movieTitle}
                                            onChange={(e) => setEditingPost({ ...editingPost, movieTitle: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-text dark:text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setEditingPost({ ...editingPost, rating: star })}
                                                    className={`text-3xl transition-all ${star <= editingPost.rating ? 'text-[#fc1723]' : 'text-text/20 dark:text-gray-600'}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-text/70 dark:text-gray-400 mb-2 text-sm">Your Review</label>
                                        <textarea
                                            required
                                            value={editingPost.content}
                                            onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-text dark:text-white focus:outline-none focus:border-primary resize-none"
                                            rows="5"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 rounded-lg transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* View Post Modal with Comments */}
                <AnimatePresence>
                    {selectedPost && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
                            onClick={() => setSelectedPost(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-surface rounded-2xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Scrollable Content Area */}
                                <div className="flex-1 overflow-y-auto">
                                    {/* Movie Poster Banner */}
                                    {selectedPost.moviePoster && (
                                        <div className="relative h-80 bg-gradient-to-b from-black/40 to-black/80 flex-shrink-0">
                                            <img
                                                src={selectedPost.moviePoster}
                                                alt={selectedPost.movieTitle}
                                                className="w-full h-full object-cover opacity-40"
                                            />
                                            <div className="absolute inset-0 flex items-end p-6">
                                                <div>
                                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedPost.movieTitle}</h2>
                                                    {selectedPost.movieYear && (
                                                        <p className="text-white/80 text-sm mb-2">{selectedPost.movieYear}</p>
                                                    )}
                                                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-flex border border-white/10">
                                                        <span className="text-[#fc1723] font-bold text-lg">★</span>
                                                        <span className="text-sm font-semibold text-[#fc1723]">{selectedPost.rating}/5</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedPost(null)}
                                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full p-2"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Content Section */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl flex-shrink-0">
                                                    {selectedPost.profileIcon || '👤'}
                                                </div>
                                                <div className="flex-1">
                                                    {!selectedPost.moviePoster && (
                                                        <h2 className="text-2xl font-bold text-text dark:text-white mb-2">{selectedPost.movieTitle}</h2>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-text/60 dark:text-gray-400">
                                                            {selectedPost.anonymous ? 'Anonymous' : selectedPost.author}
                                                        </span>
                                                        {!selectedPost.moviePoster && (
                                                            <span className="flex items-center gap-1 text-[#fc1723] font-semibold">
                                                                ★ {selectedPost.rating}/5
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedPost.author === currentUser.email && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingPost(selectedPost);
                                                                setSelectedPost(null);
                                                            }}
                                                            className="text-blue-500 hover:text-blue-400 transition-colors"
                                                        >
                                                            <Edit2 size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePost(selectedPost.id)}
                                                            className="text-red-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {!selectedPost.moviePoster && (
                                                    <button onClick={() => setSelectedPost(null)} className="text-text/60 hover:text-text dark:text-gray-400 dark:hover:text-white">
                                                        <X size={24} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {selectedPost.moviePlot && (
                                            <div className="mb-6 p-3 bg-background/50 rounded-lg border border-white/5">
                                                <p className="text-xs font-semibold text-text/70 dark:text-gray-400 mb-1">Plot Summary</p>
                                                <p className="text-sm text-text/80 dark:text-gray-300 italic leading-relaxed">{selectedPost.moviePlot}</p>
                                            </div>
                                        )}

                                        <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                            <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">User Review</p>
                                            <p className="text-base text-text dark:text-white leading-relaxed">{selectedPost.content}</p>
                                        </div>

                                        {/* Comments Section */}
                                        <div className="pt-4 border-t border-white/10">
                                            <h3 className="text-xl font-bold text-text dark:text-white mb-6 flex items-center gap-2">
                                                <MessageSquare size={20} className="text-primary" />
                                                Comments ({selectedPost.comments?.length || 0})
                                            </h3>
                                            {selectedPost.comments?.map((comment) => (
                                                <div key={comment.id} className="bg-background/50 rounded-lg p-4 mb-3 border border-white/5">
                                                    {editingComment?.id === comment.id ? (
                                                        <div>
                                                            <textarea
                                                                value={editingComment.content}
                                                                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text dark:text-white focus:outline-none focus:border-primary resize-none mb-2"
                                                                rows="3"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleEditComment(selectedPost.id, comment.id, editingComment.content)}
                                                                    className="text-sm bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded transition-colors"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingComment(null)}
                                                                    className="text-sm bg-surface hover:bg-white/5 text-text dark:text-white px-3 py-1 rounded transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-start gap-3 mb-2">
                                                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-lg flex-shrink-0">
                                                                    {comment.profileIcon || '👤'}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-base font-semibold text-text dark:text-white">{comment.author}</span>
                                                                        {comment.author === currentUser.email && (
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => setEditingComment(comment)}
                                                                                    className="text-blue-500 hover:text-blue-400 transition-colors"
                                                                                >
                                                                                    <Edit2 size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                                                                                    className="text-red-500 hover:text-red-400 transition-colors"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-text dark:text-white text-base mt-2 leading-relaxed">{comment.content}</p>
                                                                    <span className="text-xs text-text/50 dark:text-gray-500 mt-2 block">{new Date(comment.timestamp).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                                                <p className="text-text/60 dark:text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Add Comment - Fixed at bottom */}
                                <div className="flex-shrink-0 p-6 border-t border-white/10 bg-surface">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedPost.id)}
                                            className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-2 text-text dark:text-white focus:outline-none focus:border-primary"
                                            placeholder="Add a comment..."
                                        />
                                        <button
                                            onClick={() => handleAddComment(selectedPost.id)}
                                            className="bg-primary hover:bg-primary/80 text-white p-2 rounded-lg transition-colors"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Reviews;
