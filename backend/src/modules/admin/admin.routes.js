const express = require('express');
const adminController = require('./admin.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware');

const router = express.Router();

const adminGuard = [authMiddleware, roleMiddleware('admin')];

router.get('/analytics', adminGuard, adminController.getAnalytics);
router.get('/users', adminGuard, adminController.listUsers);
router.patch('/users/:userId/block', adminGuard, adminController.updateUserStatus);

router.get('/questions', adminGuard, adminController.listQuestions);
router.post('/questions', adminGuard, adminController.createQuestion);
router.put('/questions/:questionId', adminGuard, adminController.updateQuestion);
router.delete('/questions/:questionId', adminGuard, adminController.deleteQuestion);

router.get('/results', adminGuard, adminController.listResults);
router.get('/violations', adminGuard, adminController.listViolations);
router.get('/config', adminGuard, adminController.getCourses);

module.exports = router;
