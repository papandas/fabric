'use strict';

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';

exports.getRegistries = function (req, res, next){
    let allRegistries = new Array();
    let businessNetworkConnection;
    businessNetworkConnection = new BusinessNetworkConnection();

    return businessNetworkConnection.connect(config.composer.adminCard)
        .then(()=>{
            return businessNetworkConnection.getAllParticipantRegistries()
                .then((participantRegistries)=>{
                    for(let each in participantRegistries){
                        (function (_idx, _arr){
                            let r_type = _arr[_idx].name.split('.')
                            allRegistries.push(r_type[r_type.length-1])
                        })(each, participantRegistries)
                    }
                    res.send({'result':'success', 'registries': allRegistries})
                }).catch((error)=>{
                    console.log('error with Participant Registries', error.message);
                    res.send({'result':'failed: ' . error.message, 'registries': []})
                })
        }).catch((error)=>{
            console.log('error with business network connect.', error.message);
            res.send({'result':'failed: ' + error.message, 'registries': []})
        })
}

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