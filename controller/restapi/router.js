
'use strict';

let express = require('express');
let router = express.Router();
let format = require('date-format');

let multi_lingual = require('./features/multi_lingual');
let resources = require('./features/resources');
let getCreds = require('./features/getCredentials');
let hlcAdmin = require('./features/composer/hlcAdmin');
let hlcClient = require('./features/composer/hlcClient');
let setup = require('./features/composer/autoLoad');
let hlcFabric = require('./features/composer/queryBlockChain');
router.post('/setup/autoLoad*', setup.autoLoad);
router.get('/setup/getPort*', setup.getPort);

router.get('/fabric/getChainInfo', hlcFabric.getChainInfo);
router.get('/fabric/getChainEvents', hlcFabric.getChainEvents);
router.get('/fabric/getHistory', hlcAdmin.getHistory);

module.exports = router;
let count = 0;

router.use(function(req, res, next) {
    count++;
    console.log('['+count+'] at: '+format.asString('hh:mm:ss.SSS', new Date())+' Url is: ' + req.url);
    next(); // make sure we go to the next routes and don't stop here
});

router.get('/api/getSupportedLanguages*',multi_lingual.languages);
router.get('/api/getTextLocations*',multi_lingual.locations);
router.post('/api/selectedPrompts*',multi_lingual.prompts);

router.get('/resources/getDocs*',resources.getDocs);
router.get('/resources/getEducation*',resources.getEducation);

router.get('/getCreds*', getCreds.getServiceCreds);

router.get('/composer/admin/connect*', hlcAdmin.adminConnect);
router.get('/composer/admin/getCreds*', hlcAdmin.getCreds);
router.get('/composer/admin/getAllProfiles*', hlcAdmin.getAllProfiles);
router.get('/composer/admin/listAsAdmin*', hlcAdmin.listAsAdmin);
router.get('/composer/admin/getRegistries*', hlcAdmin.getRegistries);

router.post('/composer/admin/createProfile*', hlcAdmin.createProfile);
router.post('/composer/admin/deleteProfile*', hlcAdmin.deleteProfile);
router.post('/composer/admin/deploy*', hlcAdmin.deploy);
router.post('/composer/admin/install*', hlcAdmin.networkInstall);
router.post('/composer/admin/start*', hlcAdmin.networkStart);
router.post('/composer/admin/disconnect*', hlcAdmin.disconnect);
router.post('/composer/admin/getProfile*', hlcAdmin.getProfile);
router.post('/composer/admin/ping*', hlcAdmin.ping);
router.post('/composer/admin/undeploy*', hlcAdmin.undeploy);
router.post('/composer/admin/update*', hlcAdmin.update);
router.post('/composer/admin/getMembers*', hlcAdmin.getMembers);
router.post('/composer/admin/getAssets*', hlcAdmin.getAssets);
router.post('/composer/admin/addMember*', hlcAdmin.addMember);
router.post('/composer/admin/removeMember*', hlcAdmin.removeMember);
router.post('/composer/admin/getSecret*', setup.getMemberSecret);
router.post('/composer/admin/checkCard*', hlcAdmin.checkCard);
router.post('/composer/admin/createCard*', hlcAdmin.createCard);
router.post('/composer/admin/issueIdentity*', hlcAdmin.issueIdentity);

// router requests specific to the Buyer
router.get('/composer/client/getItemTable*', hlcClient.getItemTable);
router.post('/composer/client/getMyOrders*', hlcClient.getMyOrders);
router.post('/composer/client/addOrder*', hlcClient.addOrder);
router.post('/composer/client/orderAction*', hlcClient.orderAction);