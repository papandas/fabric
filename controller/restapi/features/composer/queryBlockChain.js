var path = require('path');
var fs = require('fs');

const hfc = require('fabric-client');
const hfcEH = require('fabric-client/lib/EventHub');

const svc = require('./Z2B_Services');
const config = require('../../../env.json');
var chainEvents = false;

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