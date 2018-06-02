'use strict';
var fs = require('fs');
var path = require('path');
const sleep = require('sleep');

const ws = require('websocket');
const http = require('http');
const express = require('express');
const app = express();
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
app.set('port', appEnv.port);

var  Z2Blockchain  = {

    createOrderTemplate: function (_inbound)
    {
        _inbound.orderNumber = '';
        _inbound.amount = 0;
        _inbound.items = [];
        _inbound.status = JSON.stringify(this.orderStatus.Created);
        _inbound.created = new Date().toISOString();
        _inbound.cancelled = '';
        _inbound.ordered = '';
        _inbound.bought = '';
        _inbound.dateBackordered = '';
        _inbound.requestShipment = '';
        _inbound.delivered = '';
        _inbound.delivering = '';
        _inbound.disputeOpened = '';
        _inbound.disputeResolved = '';
        _inbound.orderRefunded = '';
        _inbound.paymentRequested = '';
        _inbound.paid = '';
        _inbound.approved = '';
        _inbound.dispute = '';
        _inbound.resolve = '';
        _inbound.backorder = '';
        _inbound.refund = '';
        _inbound.provider = '';
        _inbound.shipper = '';
        _inbound.financeCo = '';
        return(_inbound);
    },

    saveItemTable: function (_table)
    {
        let options = { flag : 'w' };
        let newFile = path.join(path.dirname(require.main.filename),'startup','itemList.txt');
        let _mem = '{"items": [';
        for (let each in _table){
            (function(_idx, _arr){
                if(_idx>0){
                    _mem += ', ';
                } 
                _mem += JSON.stringify(_arr[_idx]);
            })(each, _table)
        }
        _mem += ']}';
        fs.writeFileSync(newFile, _mem, options);
    },

    getItem: function (_itemNo, _itemArray)
    {
        for (let each in _itemArray){ 
            if (_itemArray[each].itemNo === _itemNo){
                return (_itemArray[each]);
            }
        }
        return({'description':'Item '+_itemNo+ 'Not Found', 'unitPrice': 0, 'extendedPrice': 0});
    },

    setItem: function (_itemNo, _qty, _itemArray)
    {
        for (let each in _itemArray){
            if (_itemArray[each].itemNo === _itemNo) {
                _itemArray[each].quantity += _qty;
            } 
        }
    },

    loadTransaction: function (_con, _item, _id, businessNetworkConnection){
        return businessNetworkConnection.submitTransaction(_item)
            .then(() => {
                console.log('loadTransaction: order '+_id+' successfully added'); 
                _con.sendUTF('loadTransaction: order '+_id+' successfully added');
            }).catch((error) => {
                if (error.message.search('MVCC_READ_CONFLICT') != -1){
                    console.log("Sleep for 5 seconds.")
                    sleep.sleep(5);
                        
                    console.log(_id+" loadTransaction retrying submit transaction for: "+_id);
                    this.loadTransaction(_con,_item, _id, businessNetworkConnection);
                }
            });
    },

    addOrder: function (_con, _order, _registry, _createNew, _bnc){
        return _registry.add(_order)
            .then(() => {
                this.loadTransaction(_con,_createNew, _order.orderNumber, _bnc);
            }).catch((error) => {
                if (error.message.search('MVCC_READ_CONFLICT') != -1){
                    console.log(_order.orderNumber+" addOrder retrying assetRegistry.add for: "+_order.orderNumber);
                    this.addOrder(_con,_order, _registry, _createNew, _bnc);
                }else {
                    console.log('error with assetRegistry.add', error)
                }
            });
    },

    addItems: function (_inbound, _itemTable)
    {
        let _amount = 0;
        let _items = [];
        let _this = this;
        for (let each in _inbound.items){
            (function(_idx, _arr){
                let _item = _this.getItem(_arr[_idx].itemNo, _itemTable);
                _this.setItem(_arr[_idx].itemNo, _arr[_idx].quantity, _itemTable);
                _arr[_idx].description = _item.itemDescription;
                _arr[_idx].unitPrice = _item.unitPrice;
                _arr[_idx].extendedPrice = _item.unitPrice*_arr[_idx].quantity;
                _amount += _arr[_idx].extendedPrice;
                _items.push(JSON.stringify(_arr[_idx]));
            })(each, _inbound.items)
        }
        return ({'items': _items, 'amount': _amount});
    },


    orderStatus: {
        Created: {code: 1, text: 'Order Created'},
        Bought: {code: 2, text: 'Order Purchased'},
        Cancelled: {code: 3, text: 'Order Cancelled'},
        Ordered: {code: 4, text: 'Order Submitted to Provider'},
        ShipRequest: {code: 5, text: 'Shipping Requested'},
        Delivered: {code: 6, text: 'Order Delivered'},
        Delivering: {code: 15, text: 'Order being Delivered'},
        Backordered: {code: 7, text: 'Order Backordered'},
        Dispute: {code: 8, text: 'Order Disputed'},
        Resolve: {code: 9, text: 'Order Dispute Resolved'},
        PayRequest: {code: 10, text: 'Payment Requested'},
        Authorize: {code: 11, text: 'Payment Approved'},
        Paid: {code: 14, text: 'Payment Processed'},
        Refund: {code: 12, text: 'Order Refund Requested'},
        Refunded: {code: 13, text: 'Order Refunded'}
    },

    m_connection: null,
    m_socketAddr: null,
    m_socket: null,
    createMessageSocket: function(_port){
        //console.log("[Create message socket init]")
        var port = (typeof(_port) == 'undefined' || _port == null) ? app.get('port')+1 : _port
        //console.log("Port", port);
        if (this.m_socket == null){
            this.m_socketAddr = port;
            this.m_socket= new ws.server({httpServer: http.createServer().listen(this.m_socketAddr)});
            var _this = this;            
            this.m_socket.on('request', function(request) {
                _this.m_connection = request.accept(null, request.origin);
                _this.m_connection.on('message', function(message){
                    console.log("[Socket Message]", message.utf8Data);
                    _this.m_connection.sendUTF('connected');
                    _this.m_connection.on('close', function(m_connection) {
                        console.log('m_connection closed'); 
                    });
                });
            });
        }
        //console.log('[Message is complete.]', this.m_connection, this.m_socketAddr)
        return {conn: this.m_connection, socket: this.m_socketAddr};
    },


    cs_connection: null,
    cs_socketAddr:null,
    cs_socket:null, 
    createChainSocket: function (){
        var port =  app.get('port')+2;
        if(this.cs_socket == null){
            this.cs_socketAddr = port;
            this.cs_socket= new ws.server({httpServer: http.createServer().listen(this.cs_socketAddr)});
            var _this = this;
            this.cs_socket.on('request', function(request){
                _this.cs_connection = request.accept(null, request.origin);
                _this.cs_connection.on('message', function(message){
                    console.log(message.utf8Data);
                    _this.cs_connection.sendUTF('connected');
                    _this.cs_connection.on('close', function(cs_connection){
                        console.log('cs_connection closed');
                    })
                })
            })
        }
        return {conn:this.cs_connection, socket: this.cs_socketAddr};
    }
}


module.exports = Z2Blockchain;