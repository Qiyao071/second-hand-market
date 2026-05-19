const express = require('express');
const router = express.Router();
const Favorite = require('../models/favorite');
const verifyToken = require('../middleware/auth');

router.post('/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const existingFavorite = await Favorite.findOne({ userId, itemId });
    if (existingFavorite) {
      return res.status(400).json({ message: '已收藏该物品' });
    }

    const favorite = new Favorite({ userId, itemId });
    await favorite.save();

    res.status(201).json({ message: '收藏成功' });
  } catch (err) {
    console.error('收藏失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const result = await Favorite.deleteOne({ userId, itemId });
    
    if (result.deletedCount === 0) {
      return res.status(400).json({ message: '未收藏该物品' });
    }

    res.json({ message: '取消收藏成功' });
  } catch (err) {
    console.error('取消收藏失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/check/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const favorite = await Favorite.findOne({ userId, itemId });
    
    res.json({ isFavorited: !!favorite });
  } catch (err) {
    console.error('检查收藏状态失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ userId });
    
    res.json(favorites);
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;