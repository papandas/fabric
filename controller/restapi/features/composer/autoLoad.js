'use strict';

const fs = require('fs');
const path = require('path');
const _home = require('os').homedir();
const hlc_idCard = require('composer-common').IdCard;

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const financeCoID = 'easymoney@easymoneyinc.com';

const svc = require('./Z2B_Services');
const config = require('../../../env.json');


let itemTable = new Array();
let socketAddr;


exports.autoLoad = function(req, res, next) {
    console.log('Init AutoLoad');
    
    let newFile = path.join(path.dirname(require.main.filename),'startup','memberList.json');
    let startupFile = JSON.parse(fs.readFileSync(newFile));
    let businessNetworkConnection;
    let factory; 
    let participant;
    
    svc.createMessageSocket();
    
    socketAddr = svc.m_socketAddr;

    let adminConnection = new AdminConnection();
    adminConnection.connect(config.composer.adminCard)
        .then(()=>{
            businessNetworkConnection = new BusinessNetworkConnection();
            return businessNetworkConnection.connect(config.composer.adminCard)
                .then(()=>{
                    factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                    for (let each in startupFile.members){
                        (function(_idx, _arr){
                            return businessNetworkConnection.getParticipantRegistry(config.composer.NS+'.'+_arr[_idx].type)
                                .then((_res)=>{
                                    console.log('['+_idx+'] member with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                                    svc.m_connection.sendUTF('['+_idx+'] member with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                                }).catch((error)=>{
                                    participant = factory.newResource(config.composer.NS, _arr[_idx].type, _arr[_idx].id);
                                    participant.companyName = _arr[_idx].companyName;
                                    participantRegistry.add(participant)
                                        .then(()=>{
                                            console.log('['+_idx+'] '+_arr[_idx].companyName+' successfully added');
                                            svc.m_connection.sendUTF('['+_idx+'] '+_arr[_idx].companyName+' successfully added');
                                        }).then(()=>{
                                            console.log('issuing identity for: '+config.composer.NS+'.'+_arr[_idx].type+'#'+_arr[_idx].id);
                                            return businessNetworkConnection.issueIdentity(config.composer.NS+'.'+_arr[_idx].type+'#'+_arr[_idx].id, _arr[_idx].id)
                                                .then((result)=>{
                                                    console.log('_arr[_idx].id: '+_arr[_idx].id);
                                                    console.log('result.userID: '+result.userID);

                                                    let _mem = _arr[_idx];
                                                    _mem.secret = result.userSecret;
                                                    _mem.userID = result.userID;
                                                    memberTable.push(_mem);

                                                    let _meta = {};
                                                    for (each in config.composer.metaData){
                                                        (function(_idx, _obj){
                                                            _meta[_idx] = _obj[_idx];
                                                        })(each, config.composer.metaData)
                                                    }
                                                    _meta.businessNetwork = config.composer.network;
                                                    _meta.userName = result.userID;
                                                    _meta.enrollmentSecret = result.userSecret;
                                                    config.connectionProfile.keyValStore = _home+config.connectionProfile.keyValStore;

                                                    let tempCard = new hlc_idCard(_meta, config.connectionProfile);
                                                    return adminConnection.importCard(result.userID, tempCard)
                                                        .then((_res)=>{
                                                            if(_res){
                                                                console.log('card updated');
                                                            }else{
                                                                console.log('card imported');
                                                            }
                                                        }).catch((error)=>{
                                                            console.error('adminConnection.importCard failed. ',error.message);
                                                        })
                                                }).catch((error)=>{
                                                    console.error('create id for '+_arr[_idx].id+'failed. ',error.message);
                                                })
                                        }).catch((error) => {
                                            console.log(_arr[_idx].companyName+' add failed',error.message);
                                        });
                                }).catch((error) => {
                                    console.log('error with getParticipantRegistry', error.message);
                                });
                        })(each, startupFile.members)
                    }

                    for (let each in startupFile.items){
                        (function(_idx, _arr){
                            itemTable.push(_arr[_idx]);
                        })(each, startupFile.items);
                    }

                    svc.saveItemTable(itemTable);

                    for (let each in startupFile.assets){
                        (function(_idx, _arr){
                            return businessNetworkConnection.getAssetRegistry(config.composer.NS+'.'+_arr[_idx].type)
                                .then((assetRegistry)=>{
                                    return assetRegistry.get(_arr[_idx].id)
                                        .then((_res)=>{
                                            console.log('['+_idx+'] order with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                                            svc.m_connection.sendUTF('['+_idx+'] order with id: '+_arr[_idx].id+' already exists in Registry '+config.composer.NS+'.'+_arr[_idx].type);
                                        }).catch((error) => {
                                            let order = factory.newResource(config.composer.NS, _arr[_idx].type, _arr[_idx].id);
                                            order = svc.createOrderTemplate(order);

                                            let _tmp = svc.addItems(_arr[_idx], itemTable);
                                            order.items = _tmp.items;
                                            order.amount = _tmp.amount;
                                            order.orderNumber = _arr[_idx].id;

                                            const createNew = factory.newTransaction(config.composer.NS, 'CreateOrder');
                                            order.buyer = factory.newRelationship(config.composer.NS, 'Buyer', _arr[_idx].buyer);
                                            order.seller = factory.newRelationship(config.composer.NS, 'Seller', _arr[_idx].seller);
                                            order.provider = factory.newRelationship(config.composer.NS, 'Provider', 'noop@dummy');
                                            order.shipper = factory.newRelationship(config.composer.NS, 'Shipper', 'noop@dummy');
                                            order.financeCo = factory.newRelationship(config.composer.NS, 'FinanceCo', financeCoID);
                                            createNew.financeCo = factory.newRelationship(config.composer.NS, 'FinanceCo', financeCoID);
                                            createNew.order = factory.newRelationship(config.composer.NS, 'Order', order.$identifier);
                                            createNew.buyer = factory.newRelationship(config.composer.NS, 'Buyer', _arr[_idx].buyer);
                                            createNew.seller = factory.newRelationship(config.composer.NS, 'Seller', _arr[_idx].seller);
                                            createNew.amount = order.amount;

                                            return assetRegistry.add(order)
                                                .then(()=>{
                                                    svc.loadTransaction(svc.m_connection, createNew, order.orderNumber, businessNetworkConnection);
                                                }).catch((error) => {
                                                    if (error.message.search('MVCC_READ_CONFLICT') !== -1){
                                                        console.log('AL: '+_arr[_idx].id+' retrying assetRegistry.add for: '+_arr[_idx].id);
                                                        svc.addOrder(svc.m_connection, order, assetRegistry, createNew, businessNetworkConnection);
                                                    }else {
                                                        console.log('error with assetRegistry.add', error.message);
                                                    }
                                                })
                                        })
                                }).catch((error) => {
                                    console.log('error with getParticipantRegistry', error.message);
                                });
                        })(each, startupFile.assets);
                    }
                }).catch((error) => {
                    console.log('error with business network Connect', error.message);
                });
        }).catch((error) => {
            console.log('error with adminConnect', error.message);
        });

    res.send({'port': socketAddr});
}