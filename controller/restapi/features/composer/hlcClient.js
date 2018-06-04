


'use strict';
let fs = require('fs');
let path = require('path');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
// const config = require('../../../env.json');
const NS = 'org.acme.Z2BTestNetwork';
let itemTable = null;
const svc = require('./Z2B_Services');
const financeCoID = 'easymoney@easymoneyinc.com';


exports.getMyOrders = function (req, res, next) {
    // connect to the network
    let method = 'getMyOrders';
    console.log(method+' req.body.userID is: '+req.body.userID );
    let allOrders = new Array();
    let businessNetworkConnection;
    if (svc.m_connection === null) {svc.createMessageSocket();}
    let ser;
    let archiveFile = fs.readFileSync(path.join(path.dirname(require.main.filename),'network','dist','zerotoblockchain-network.bna'));
    businessNetworkConnection = new BusinessNetworkConnection();
    return BusinessNetworkDefinition.fromArchive(archiveFile)
    .then((bnd) => {
        ser = bnd.getSerializer();
        //
        // v0.14
        // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.userID, req.body.secret)
        //
        // v0.15
        console.log(method+' req.body.userID is: '+req.body.userID );
        return businessNetworkConnection.connect(req.body.userID)
        .then(() => {
            return businessNetworkConnection.query('selectOrders')
            .then((orders) => {
                allOrders = new Array();
                for (let each in orders)
                    { (function (_idx, _arr)
                        {
                        let _jsn = ser.toJSON(_arr[_idx]);
                        _jsn.id = _arr[_idx].orderNumber;
                        allOrders.push(_jsn);
                    })(each, orders);
                }
                res.send({'result': 'success', 'orders': allOrders});
            })
            .catch((error) => {console.log('selectOrders failed ', error);
                res.send({'result': 'failed', 'error': 'selectOrders: '+error.message});
            });
        })
        .catch((error) => {console.log('businessNetwork connect failed ', error);
            res.send({'result': 'failed', 'error': 'businessNetwork: '+error.message});
        });
    })
    .catch((error) => {console.log('create bnd from archive failed ', error);
        res.send({'result': 'failed', 'error': 'create bnd from archive: '+error.message});
    });
};



exports.getItemTable = function (req, res, next)
{
    if (itemTable === null)
    {
        let newFile = path.join(path.dirname(require.main.filename),'startup','itemList.txt');
        itemTable = JSON.parse(fs.readFileSync(newFile));
    }
    res.send(itemTable);
};


exports.orderAction = function (req, res, next) {
    let method = 'orderAction';
    console.log(method+' req.body.participant is: '+req.body.participant );
    if ((req.body.action === 'Dispute') && (typeof(req.body.reason) !== 'undefined') && (req.body.reason.length > 0) )
    {/*let reason = req.body.reason;*/}
    else {
        if ((req.body.action === 'Dispute') && ((typeof(req.body.reason) === 'undefined') || (req.body.reason.length <1) ))
            {res.send({'result': 'failed', 'error': 'no reason provided for dispute'});}
    }
    if (svc.m_connection === null) {svc.createMessageSocket();}
    let businessNetworkConnection;
    let updateOrder;
    businessNetworkConnection = new BusinessNetworkConnection();
    //
    // v0.14
    // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.participant, req.body.secret)
    //
    // v0.15
    return businessNetworkConnection.connect(req.body.participant)
    .then(() => {
        return businessNetworkConnection.getAssetRegistry(NS+'.Order')
        .then((assetRegistry) => {
            return assetRegistry.get(req.body.orderNo)
            .then((order) => {
                let factory = businessNetworkConnection.getBusinessNetwork().getFactory();
                order.status = req.body.action;
                switch (req.body.action)
                {
                case 'Dispute':
                    console.log('Dispute entered');
                    // ========> Your Code Goes Here <=========
                    break;
                case 'Purchase':
                    console.log('Purchase entered');
                    // ========> Your Code Goes Here <=========
                    break;
                case 'Resolve':
                    console.log('Resolve entered');
                    // ========> Your Code Goes Here <=========
                    break;
                case 'Authorize Payment':
                    console.log('Authorize Payment entered');
                    // ========> Your Code Goes Here <=========
                    break;
                case 'Cancel':
                    console.log('Cancel entered');
                    // ========> Your Code Goes Here <=========
                    break;
                default :
                    console.log('default entered for action: '+req.body.action);
                    res.send({'result': 'failed', 'error':' order '+req.body.orderNo+' unrecognized request: '+req.body.action});
                }
                updateOrder.order = factory.newRelationship(NS, 'Order', order.$identifier);
                return businessNetworkConnection.submitTransaction(updateOrder)
                .then(() => {
                    console.log(' order '+req.body.orderNo+' successfully updated to '+req.body.action);
                    res.send({'result': ' order '+req.body.orderNo+' successfully updated to '+req.body.action});
                })
                .catch((error) => {
                    if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                        {console.log(' retrying assetRegistry.update for: '+req.body.orderNo);
                        svc.loadTransaction(svc.m_connection, updateOrder, req.body.orderNo, businessNetworkConnection);
                    }
                    else
                    {console.log(req.body.orderNo+' submitTransaction to update status to '+req.body.action+' failed with text: ',error.message);}
                });

            })
            .catch((error) => {
                console.log('Registry Get Order failed: '+error.message);
                res.send({'result': 'failed', 'error': 'Registry Get Order failed: '+error.message});
            });
        })
        .catch((error) => {console.log('Get Asset Registry failed: '+error.message);
            res.send({'result': 'failed', 'error': 'Get Asset Registry failed: '+error.message});
        });
    })
    .catch((error) => {console.log('Business Network Connect failed: '+error.message);
        res.send({'result': 'failed', 'error': 'Get Asset Registry failed: '+error.message});
    });
};


exports.addOrder = function (req, res, next) {
    let method = 'addOrder';
    console.log(method+' req.body.buyer is: '+req.body.buyer );
    let businessNetworkConnection;
    let factory;
    let ts = Date.now();
    let orderNo = req.body.buyer.replace(/@/, '').replace(/\./, '')+ts;
    if (svc.m_connection === null) {svc.createMessageSocket();}
    businessNetworkConnection = new BusinessNetworkConnection();
    //
    // v0.14
    // return businessNetworkConnection.connect(config.composer.connectionProfile, config.composer.network, req.body.buyer, req.body.secret)
    //
    // v0.15
    return businessNetworkConnection.connect(req.body.buyer)
    .then(() => {
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();
        let order = factory.newResource(NS, 'Order', orderNo);
        order = svc.createOrderTemplate(order);
        order.amount = 0;
        order.orderNumber = orderNo;
        order.buyer = factory.newRelationship(NS, 'Buyer', req.body.buyer);
        order.seller = factory.newRelationship(NS, 'Seller', req.body.seller);
        order.provider = factory.newRelationship(NS, 'Provider', 'noop@dummy');
        order.shipper = factory.newRelationship(NS, 'Shipper', 'noop@dummy');
        order.financeCo = factory.newRelationship(NS, 'FinanceCo', financeCoID);
        for (let each in req.body.items)
        {(function(_idx, _arr)
            {   _arr[_idx].description = _arr[_idx].itemDescription;
            order.items.push(JSON.stringify(_arr[_idx]));
            order.amount += parseInt(_arr[_idx].extendedPrice);
        })(each, req.body.items);
        }
        // create the buy transaction

        // add the order to the asset registry.
        return businessNetworkConnection.getAssetRegistry(NS+'.Order')
        .then((assetRegistry) => {
            return assetRegistry.add(order)
                .then(() => {
                    // ========> Your Code Goes Here <=========
                })
                .catch((error) => {
                    if (error.message.search('MVCC_READ_CONFLICT') !== -1)
                        {console.log(orderNo+' retrying assetRegistry.add for: '+orderNo);
                        svc.loadTransaction(createNew, orderNo, businessNetworkConnection);
                    }
                    else
                    {
                        console.log(orderNo+' assetRegistry.add failed: ',error.message);
                        res.send({'result': 'failed', 'error':' order '+orderNo+' getAssetRegistry failed '+error.message});
                    }
                });
        })
        .catch((error) => {
            console.log(orderNo+' getAssetRegistry failed: ',error.message);
            res.send({'result': 'failed', 'error':' order '+orderNo+' getAssetRegistry failed '+error.message});
        });
    })
    .catch((error) => {
        console.log(orderNo+' business network connection failed: text',error.message);
        res.send({'result': 'failed', 'error':' order '+orderNo+' add failed on on business network connection '+error.message});
    });
};
