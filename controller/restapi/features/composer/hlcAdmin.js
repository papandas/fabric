'use strict';

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';

exports.getMembers = function(req, res, next) {
    let allMembers = new Array();
    let businessNetworkConnection;
    businessNetworkConnection = new BusinessNetworkConnection();
    return businessNetworkConnection.connect(config.composer.adminCard)
        .then(() => {
            return businessNetworkConnection.getParticipantRegistry(NS+'.'+req.body.registry)
                .then(function(registry){
                    res.send({'result':'registry ' + registry});
                    
                    //========> Code Goes Here <=========

                }).catch((error)=>{
                    console.log('error with getRegistry', error);
                    res.send({'result':'failed '+error.message, 'members':[]});
                });
        }).catch((error)=>{
            console.log('error with business network connect.', error.message);
            res.send({'result':'failed ' + error.message, 'members':[]});
        })
    

};