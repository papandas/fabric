let msgPort = null;
let _blctr = 0;


function wsDisplay(_target, _port)
{
    let content = $('#'+_target);
    let wsSocket = new WebSocket('ws://localhost:'+_port);
    wsSocket.onopen = function () {
        wsSocket.send('connected to client');
    };
    wsSocket.onmessage = function (message) {
        content.append(formatMessage(message.data));
    };
    wsSocket.onerror = function (error) {
        console.log('WebSocket error on wsSocket: ' + error);
    };
}

function preLoad(){
    $('#body').empty();
    let options = {};
    $.when($.post('/setup/autoLoad', options)).done(function(_results){
        msgPort = _results.port;
        wsDisplay('body', msgPort);
    });
}

function getChainEvents(){
    $.when($.get('fabric/getChainEvents')).done(function(_res){
        let _str = '<h2> Get Chain events requested. Sending to port: '+_res.port+'</h2>';
        let content = $('#blockchain');
        let csSocket = new WebSocket('ws://localhost:'+_res.port);
        csSocket.onopen = function (){
            csSocket.send('Connected to Client');
        };
        csSocket.onmessage = function(message){
            _blctr++;
            if(message.data !== 'connected'){
                $(content).append('<span class="block">block '+JSON.parse(message.data).header.number+'<br/>Hash: '+JSON.parse(message.data).header.data_hash+'</span>');
                if(_blctr > 4){
                    let leftPos = $(content).scrollLeft();
                    $(content).animate({scrollLeft: leftPos + 300}, 250);
                }
            }
        }
        csSocket.onerror = function(error){
            console.log('WebSocket error: '+ error);
        }
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}