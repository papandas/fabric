var express = require('express');
var router = express.Router();
var format = require('date-format');

var multi_lingual = require('./features/multi_lingual');
var hlcAdmin = require('./features/composer/hlcAdmin');
var setup = require('./features/composer/autoLoad');
var hlcFabric = require('./features/composer/queryBlockChain');
router.post('/setup/autoLoad*', setup.autoLoad);

router.get('/fabric/getChainEvents', hlcFabric.getChainEvents);

module.exports = router;

var count = 0;

router.use(function(req, res, next) {
    count++;
    console.log('['+count+'] at: '+format.asString('hh:mm:ss.SSS', new Date())+' Url is: ' + req.url);
    next();
});

router.get('/api/getSupportedLanguages*',multi_lingual.languages);
router.get('/api/getTextLocations*',multi_lingual.locations);
router.post('/api/selectedPrompts*',multi_lingual.prompts);


router.post('/composer/admin/getMembers*', hlcAdmin.getMembers);