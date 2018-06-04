'use strict';
const fs = require('fs');
const path = require('path');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
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

exports.getAssets = function(req, res, next) {
    // connect to the network
    let allOrders = new Array();
    let businessNetworkConnection;
    let serializer;
    let archiveFile = fs.readFileSync(path.join(path.dirname(require.main.filename),'network','dist','zerotoblockchain-network.bna'));
    businessNetworkConnection = new BusinessNetworkConnection();
    return BusinessNetworkDefinition.fromArchive(archiveFile)
        .then((bnd)=>{
            serializer = bnd.getSerializer();
            return businessNetworkConnection.connect(config.composer.adminCard)
            .then(()=>{
                return businessNetworkConnection.getAssetRegistry(NS + '.' + req.body.registry)
                .then((registry)=>{
                    return registry.getAll()
                    .then((members)=>{
                        console.log('there are '+members.length+' entries in the '+req.body.registry+' Registry with id: '+members[0].$namespace);
                        for (let each in members){
                            (function(_idx, _arr){
                                console.log(_idx, _arr[_idx])
                                switch(req.body.type){
                                    case 'Buyer':
                                        if(req.body.id === _arr[_idx].buyer.$identifier){
                                            let _jsn = serializer.toJSON(_arr[_idx]);
                                            _jsn.type = req.body.registry;
                                            switch (req.body.registry){
                                                case 'Order':
                                                    _jsn.id = _arr[_idx].orderNumber;
                                                    break;
                                                default:
                                                    _jsn.id = _arr[_idx].id;
                                            }
                                            allOrders.push(_jsn);
                                        }
                                        break;
                                    case 'admin':
                                        let _jsn = serializer.toJSON(_arr[_idx]);
                                        _jsn.type = req.body.registry;
                                        switch (req.body.registry){
                                            case 'Order':
                                                _jsn.id = _arr[_idx].orderNumber;
                                                break;
                                            default:
                                                _jsn.id = _arr[_idx].id;
                                        }
                                        allOrders.push(_jsn);
                                        break;
                                    default:
                                        _jsn.id = _arr[_idx].id;
                                }
                                
                            })(each, members)
                        }
                        res.send({'result': 'success', 'orders': allOrders});
                    }).catch((error)=>{
                        console.log(('[GetAssets] error while registry.getAll()', error.message))
                        res.send({'result': 'failed', 'error': 'getAllOrders: ' + error.message});
                    })
                }).catch((error)=>{
                    console.log('[GetAssets] error while getAssetRegistry', error.message)
                    res.send({'result': 'failed', 'error': 'getAssetRegistry: ' + error.message});
                })
            }).catch((error)=>{
                console.log('[GetAssets] error while connect.', error.message)
                res.send({'result': 'failed', 'error': 'connect: ' + error.message});
            })
        })
}