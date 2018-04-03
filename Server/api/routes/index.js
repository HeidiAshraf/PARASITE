/* eslint-disable max-len */
/* eslint-disable max-statements */

var express = require('express');
var router = express.Router();


var psychCtrl = require('../controllers/PsychologistController');
var productCtrl = require('../controllers/ProductController');
var userController = require('../controllers/UserController');
var ActivityController = require('../controllers/ActivityController');
var profileController = require('../controllers/ProfileController');
var contentController = require('../controllers/ContentController');
var studyPlanController = require('../controllers/StudyPlanController');
var adminController = require('../controllers/AdminController');
var scheduleController = require('../controllers/ScheduleController');


var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    data: null,
    error: null,
    msg: 'User Is Not Signed In!'
  });
};

var isNotAuthenticated = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }

  return res.status(403).json({
    data: null,
    error: null,
    msg: 'User Is Already Signed In!'
  });
};

module.exports = function (passport) {

  /* GET home page. */
  router.get('/', function (req, res, next) {
    res.send('Server Works');
  });

  // ------------- psychologist's requests Controller ------------- //
  router.get('/psychologist', psychCtrl.getPsychologists);
  router.post('/psychologist/request/add/addRequest', psychCtrl.addRequest);
  router.get('/psychologist/request/getRequests', psychCtrl.getRequests);
  router.post('/psychologist/request/evalRequest', psychCtrl.evaluateRequest);
  // ------------- psychologist's requests Controller ------------- //

  // --------------Product Controller---------------------- //
  router.get('/market/getMarketPage/:entriesPerPage/:' +
    'pageNumber/:name/:price', productCtrl.getMarketPage);
  router.get(
    '/market/getNumberOfProducts/:name/:price',
    productCtrl.getNumberOfProducts
  );
  router.get('/market/getMarketPage/:entriesPerPage/:' +
    'pageNumber/:seller', productCtrl.getMarketPageBySeller);
  router.get(
    '/market/getNumberOfProducts/:seller',
    productCtrl.getNumberOfProductsBySeller
  );
  router.get('/product/getProduct/:productId', productCtrl.getProduct);
  router.post('/productrequest/evaluateRequest', productCtrl.evaluateRequest);
  router.get('/productrequest/getRequests', productCtrl.getRequests);
  router.post('/productrequest/createproduct', productCtrl.createProduct);
  router.post('/productrequest/createProductRequest', productCtrl.createProductRequest);

  // --------------End Of Product Contoller ---------------------- //

  // --------------------- Activity Contoller -------------------- //
  router.get('/activities', ActivityController.getActivities);
  router.get('/activities/:activityId', ActivityController.getActivity);
  router.post('/activities', ActivityController.postActivity);
  // --------------------- End of Activity Controller ------------ //

  // ---------------------- User Controller ---------------------- //
  router.post('/signup', isNotAuthenticated, passport.authenticate('local-signup'), userController.signUp);
  router.post('/signin', isNotAuthenticated, passport.authenticate('local-signin'), userController.signIn);
  router.get('/signout', isAuthenticated, function (req, res) {
    req.logout();

    return res.status(200).json({
      data: null,
      error: null,
      msg: 'Sign Out Successfully!'
    });
  });
  // ---------------------- End of User Controller --------------- //
  //-------------------- Study Plan Endpoints ------------------//
  router.get('/study-plan/getPersonalStudyPlans/:username', studyPlanController.getPerosnalStudyPlans);
  router.get('/study-plan/getPublishedStudyPlans/:pageNumber', studyPlanController.getPublishedStudyPlans);
  router.get('/study-plan/getPersonalStudyPlan/:username/:studyPlanID', studyPlanController.getPerosnalStudyPlan);
  router.get('/study-plan/getPublishedStudyPlan/:studyPlanID', studyPlanController.getPublishedStudyPlan);
  router.patch('/study-plan/createStudyPlan/:username', studyPlanController.createStudyPlan);
  router.post('/study-plan/PublishStudyPlan', studyPlanController.PublishStudyPlan);
  //------------------- End of Study Plan Endpoints-----------//

  // -------------- Admin Contoller ---------------------- //
  router.get('/admin/VerifiedContributerRequests', adminController.getVCRs);
  router.get('/admin/PendingContentRequests', adminController.viewPendingContReqs);
  router.patch('/admin/RespondContentRequest/:ContentRequestId', adminController.respondContentRequest);
  // --------------End Of Admin Contoller ---------------------- //


  //-------------------- Profile Module Endpoints ------------------//
  router.post(
    '/profile/VerifiedContributerRequest',
    profileController.requestUserValidation
  );
  router.get(
    '/profile/:username',
    profileController.getUserInfo
  );
  // router.get(
  //   '/profile/LinkAnotherParent/:parentID',
  //   profileController.linkAnotherParent
  // );


  //  router.get('/profile/:userId/getChildren', profileController.getProduct);
  //------------------- End of Profile module Endpoints-----------//

    // --------------Content Module Endpoints---------------------- //

    // Content Managemen

    // Create a category
    router.post('/content/category', contentController.createCategory);
    // Create a section

    router.patch(
      '/content/category/:id/section',
      contentController.createSection
    );

    //Category retrieval
    router.get('/content/category', contentController.getCategories);


    // Content Retrieval

    // Get a page of content
    router.get(
      '/content/getContentPage/:numberOfEntriesPerPage' +
      '/:pageNumber/:category/:section',
      contentController.getContentPage
    );

    // Get the contents of a user
    router.get(
      '/content/username/:creator/:pageSize/:pageNumber',
      contentController.getContentByCreator
    );

    // Get content by id
    router.get(
      '/content/view/:id',
      contentController.getContentById
    );

    // Get Categories
    router.get(
      '/content/category',
      contentController.getCategories
    );

    //Content Production

    // Create new Content
    router.post('/content', contentController.createContent);


    // -------------------------------------------------------------------- //
  module.exports = router;

  return router;
};
