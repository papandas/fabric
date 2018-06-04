'use strict';

let msgPort = null;
let _blctr = 0;

function loadAdminUX(){
    let toLoad = 'admin.html';
    $.when($.get(toLoad)).done(function(page){
        $('#body').empty();
        $('#body').append(page);
        updatePage('admin');
        listMemRegistries();
    })
}

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

function listMemRegistries(){
    $.when($.get('/composer/admin/getRegistries')).done(function(_results){
        $('#registryName').empty();
        let _str = '';
        _str += '<h2>Registry List</h2>';
        _str += '<h4>Network update results: '+_results.result+'</h4>';
        _str += '<ul>';

        for (let each in _results.registries){
            (function(_idx, _arr){
                _str += '<li>'+_arr[_idx]+'</li>';
                $('#registryName').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                $('#registryName2').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                $('#registryName3').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                $('#registryName4').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                $('#registryName5').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
            })(each, _results.registries)
        }

        _str += '</ul>';

        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

function listAssets()
{
    let options = {};
    options.registry = 'Order';
    options.type='admin';
    $.when($.post('/composer/admin/getAssets', options)).done(function (_results){
        console.log(_results);
    })

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