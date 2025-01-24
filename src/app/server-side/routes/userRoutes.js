const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const AuthUser = require('../models/authUser');
const Project = require('../models/project');
const FurnitureCard = require('../models/furnitureCard');
const { checkUserAccess } = require('../helpers/jwtHandlers');

// Убедитесь, что соединение с MongoDB установлено один раз
mongoose.set('strictQuery', true);

// Удаление JWT
router.delete('/jwt/delete', async (req, res) => {
  try {
    const jwtToken = req.body.jwtToken; // Используем тело запроса вместо params
    const userId = await checkUserAccess(jwtToken);
    if (!userId) return res.status(404).json({ message: 'User not found' });

    const authUser = await AuthUser.findOne({ userId });
    if (!authUser) return res.status(404).json({ message: 'User not found' });

    authUser.jwtTokens = authUser.jwtTokens.filter(token => token !== jwtToken); // Фильтруем JWT
    await authUser.save();

    res.status(200).json({ message: 'JWT deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Создание пользователя
router.post('/user/create', async (req, res) => {
  try {
    const { email, nickname, userType, password, googleId } = req.body;

    const existingUser = await AuthUser.findOne({
      $or: [
        { 'emailData.email': email },
        { 'googleData.email': email },
      ],
    });

    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const newUser = new User({ nickname, jwtTokens: [] });
    await newUser.save();

    const authUser = new AuthUser({
      userId: newUser._id,
      emailData: userType === 'email' ? { email, password } : {},
      googleData: userType === 'google' ? { email, googleId } : {},
    });
    await authUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получение пользователя
router.get('/user/get', async (req, res) => {
  try {
    const jwtToken = req.query.jwtToken;
    const userId = await checkUserAccess(jwtToken);
    if (!userId) return res.status(404).json({ message: 'User not found' });

    const user = await User.findById(userId);
    const authUser = await AuthUser.findOne({ userId });
    if (!user || !authUser) return res.status(404).json({ message: 'User not found' });

    const userProjects = await Project.find({ authorId: userId });
    const userFurnitureCards = await FurnitureCard.find({ authorId: userId });

    res.status(200).json({
      userData: {
        email: authUser.emailData.email,
        nickname: user.nickname,
        projects: userProjects,
        furnitureCards: userFurnitureCards,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Удаление пользователя
router.delete('/user/delete', async (req, res) => {
  try {
    const jwtToken = req.body.jwtToken; // Используем тело запроса вместо params
    const userId = await checkUserAccess(jwtToken);
    if (!userId) return res.status(404).json({ message: 'User not found' });

    await AuthUser.findOneAndDelete({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Обновление пользователя
router.put('/user/put', async (req, res) => {
  try {
    const jwtToken = req.body.jwtToken;
    const userId = await checkUserAccess(jwtToken);
    if (!userId) return res.status(404).json({ message: 'User not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.userType === 'email') {
      user.nickname = req.body.nickname;
    }
    await user.save();

    res.status(200).json({ message: 'User successfully updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
