var path = require('path');
var fs = require('fs');
const express = require('express');
const app = express();
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
app.set('port', appEnv.port);

const hfc = require('fabric-client');
const hfcEH = require('fabric-client/lib/EventHub');

const svc = require('./Z2B_Services');
const util = require('./Z2B_Utilities');
const financeCoID = 'easymoney@easymoneyinc.com';
const config = require('../../../env.json');
var chainEvents = false;

exports.getChainInfo = function(req, res, next) {
    var channel = {};
    var client = null;
    var wallet_path = path.join(__dirname, 'creds');
    console.log(wallet_path);
    Promise.resolve().then(() => {
        //
        // As of 9/28/2017 there is a known and unresolved bug in HyperLedger Fabric
        // https://github.com/hyperledger/composer/issues/957
        // this requires that the file location for the wallet for Fabric version 1.0 be in the following location: 
        // {HOME}/.hfc-key-store
        // therefore the wallet location will be ignored and any private keys required to enroll a user in this process 
        // must be located in {HOME}/.hfc-key-store
        // this is currently managed for you in the installation exec by copying the private key for PeerAdmin to this location
        //
        console.log("Create a client and set the wallet location");
        client = new hfc();
        return hfc.newDefaultKeyValueStore({ path: wallet_path })
        .then((wallet) => {
            client.setStateStore(wallet);
            // change PeerAdmin in following line to adminID
            return client.getUserContext(config.composer.PeerAdmin, true);})
            .then((user) => {
                if (user === null || user === undefined || user.isEnrolled() === false) 
                    {console.error("User not defined, or not enrolled - error");}
                    channel = client.newChannel(config.fabric.channelName);
                    channel.addPeer(client.newPeer(config.fabric.peerRequestURL));
                    channel.addOrderer(client.newOrderer(config.fabric.ordererURL)); 
                 })
                .then(() => {
                    return channel.queryInfo()
                    .then((blockchainInfo) => {
                        if (blockchainInfo) {
                            res.send({"result": "success", "currentHash": blockchainInfo.currentBlockHash.toString("hex"), blockchain: blockchainInfo});
                        } else {
                            console.log('response_payload is null');
                            res.send({"result": "uncertain", "message": 'response_payload is null'});
                        }
                    })
                    .catch((_err) => {
                        console.log("queryInfo failed with _err = ", _err);
                        res.send({"result": "failed", "message": _err.message});
                    });     
                });
        });
}

exports.getChainEvents = function(req, res, next) {
    if(chainEvents){
        res.send({'port': svc.cs_socketAddr});
    }else{
        var channel = {}
        var client = null;
        var wallet_path = path.join(__dirname, 'creds');
        Promise.resolve().then(() => {
            client = new hfc();
            //console.log("Client", client)
            return hfc.newDefaultKeyValueStore({ path: wallet_path })
                .then((wallet) => {
                    //console.log("wallet", wallet)
                    client.setStateStore(wallet);
                    return client.getUserContext(config.composer.PeerAdmin, true);
                })
                .then((user) => {
                    //console.log("User => ", user)
                     if(user === null || user === undefined || user.isEnrolled() === false){
                        console.error("User not defiend, or not enrolled - error")
                    }
                    channel = client.newChannel(config.fabric.channelName);
                    channel.addPeer(client.newPeer(config.fabric.peerRequestURL));
                    channel.addOrderer(client.newOrderer(config.fabric.ordererURL));
                    //console.log("Channel=>", channel);
                    var pemPath = path.join(__dirname,'creds','admin@org.hyperledger.composer.system-cert.pem');
                    var adminPEM = fs.readFileSync(pemPath);
                    var bcEvents = new hfcEH(client);
                    bcEvents.setPeerAddr(config.fabric.peerEventURL, {pem: adminPEM});
                    //console.log('before connect')
                    bcEvents.connect();
                    svc.createChainSocket();
                    //console.log('[svc->connection port]', svc.cs_connection, svc.cs_socketAddr);
                    bcEvents.registerBlockEvent(function(event) {
                        svc.cs_connection.sendUTF(JSON.stringify(event));
                    });
                    chainEvents = true;
                    res.send({'port': svc.cs_socketAddr}); 
                });
            
                
        });
    }
}