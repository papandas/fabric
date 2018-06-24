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

function wsDisplay(_target, _port){
    let content = $('#'+_target);
    let wsSocket = new WebSocket('ws://localhost:'+_port);
    wsSocket.onopen = function () {
        console.log("[admin::wsDisplay(Targer::"+_target+",Port::"+_port+")]")
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
        _str += '<li>Distrubuter</li>';
        _str += '<li>Producer</li>';
        _str += '<li>Customer</li>';

        $('#registryName').append('<option value="Buyer">Distrubuter</option>');
        $('#registryName').append('<option value="Seller">Producer</option>');
        $('#registryName').append('<option value="Shipper">Customer</option>');

        for (let each in _results.registries){
            

            (function(_idx, _arr){
                //_str += '<li>'+_arr[_idx]+'</li>';
                //$('#registryName').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                //$('#registryName2').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                //$('#registryName3').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                //$('#registryName4').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');
                //$('#registryName5').append('<option value="'+_arr[_idx]+'">' +_arr[_idx]+'</option>');

            })(each, _results.registries)
        }

        _str += '</ul>';

        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

function listRegistry(){
    let options = {};
    options.registry = $('#registryName').find(':selected').text();
    $.when($.post('/composer/admin/getMembers', options)).done(function (_results){
        console.log(_results);
        let _str = '';
        _str +='<h2>Registry List</h2>';
        _str += '<h4>Network update results: '+_results.result+'</h4>';
        _str += '<table width="100%"><tr><th>Company</th><th>email</th></tr>';
        for (let each in _results.members){
            (function(_idx, _arr){
                _str += '<tr><td>'+_arr[_idx].companyName+'</td><td>'+_arr[_idx].id+'</td></tr>';
            })(each, _results.members);
        }
        _str += '</ul>';
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

function issueIdentity(){
    let options = {};
    let member_list;
    options.registry = $('#registryName4').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
    $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        $('#member_type').append(options.registry);
        updatePage('removeMember');
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members);
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            options.type = $('#member_type').text();
            console.log(options);
            $('#messages').append(formatMessage('starting issue identity request.'));
            $.when($.post('/composer/admin/issueIdentity', options)).done(function (_results)
                { let _msg = ((_results.result === 'success') ? 'user id: '+_results.userID+'<br/>secret: '+_results.secret : _results.message);
                $('#messages').append(formatMessage(_msg));});
        });
        $('#member_list').on('change',function()
            { let id = $('#member_list').find(':selected').text();
            displayMember(id, member_list);
        });
    });
}

function issueIdentity(){

}

function listProduct(){
    console.log("Show lis of products")
    $.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
    {
        console.log(_items);
    });
}

function listAssets(){
    let options = {};
    options.registry = 'Order';
    options.type='admin';
    $.when($.post('/composer/admin/getAssets', options)).done(function (_results){
        let _str = '';
        _str +='<h2>Registry List</h2>';
        _str += '<h4>Network update results: '+_results.result+'</h4>';
        if (_results.result === 'success'){
            _str += '<table width="100%"><tr><th>Order Number</th><th>Created</th><th>Status</th><th>Buyer/Seller</th><th>Amount</th></tr>';
            for (let each in _results.orders){
                (function(_idx, _arr){
                    _str += '<tr><td align="center">'+_arr[_idx].id+'</td><td>'+_arr[_idx].created+'</td><td>'+JSON.parse(_arr[_idx].status).text+'</td><td>'+_arr[_idx].buyer+'<br/>'+_arr[_idx].seller+'</td><td align="right">$'+_arr[_idx].amount+'.00</td></tr>';
                })(each, _results.orders);
            }
            _str += '</ul>';
        } else {
            _str += '<br/>'+_results.error;
        }
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    })

}

function addMember(){
    $.when($.get('createMember.html')).done(function (_page){
        $('#admin-forms').empty();
        $('#admin-forms').append(_page);
        updatePage('createMember');
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        $('#messages').empty();
        $('#messages').append('<br/>Please fill in add member form.');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            $('#messages').append('<br/>starting add member request.');
            let options = {};
            options.companyName = $('#companyName').val();
            options.id = $('#participant_id').val();
            options.type = $('#member_type').find(':selected').text();
            $.when($.post('/composer/admin/addMember', options)).done(function(_res)
            { $('#messages').append(formatMessage(_res)); });
        })
    })
}


function removeMember(){
    let options = {};
    let member_list;
    options.registry = $('#registryName2').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append(formatMessage('Getting Member List for '+options.registry+'.'));
    $.when($.post('/composer/admin/getMembers', options),$.get('removeMember.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        $('#member_type').append(options.registry);
        updatePage('removeMember');
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members)
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            $('#member_list').find(':selected').remove();
            $('#messages').append(formatMessage('starting delete member request.'));
            $.when($.post('/composer/admin/removeMember', options)).done(function (_results)
                { $('#messages').append(formatMessage(_results));});
        });
        $('#member_list').on('change',function()
            { let id = $('#member_list').find(':selected').text();
            displayMember(id, member_list);
        });
    });

}

/**
 * retrieve member secret
 */
function getSecret()
{
    let options = {};
    let member_list;
    options.registry = $('#registryName3').find(':selected').text();
    $('#admin-forms').empty();
    $('#messages').empty();
    $('#messages').append('<br/>Getting Member List for '+options.registry+'.');
    $.when($.post('/composer/admin/getMembers', options),$.get('getMemberSecret.html')).done(function (_results, _page)
    {
        $('#admin-forms').append(_page[0]);
        updatePage('getMemberSecret');
        $('#member_type').append(options.registry);
        member_list = _results[0].members;
        for (let each in _results[0].members)
        {(function(_idx, _arr){
            $('#member_list').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');
        })(each, _results[0].members)
        }
        let first = $('#member_list').find(':first').text();
        displayMember(first, member_list);
        let _cancel = $('#cancel');
        let _submit = $('#submit');
        _cancel.on('click', function (){$('#admin-forms').empty();});
        _submit.on('click', function(){
            options.id = $('#member_list').find(':selected').text();
            $('#messages').append(formatMessage('getting member secret.'));
            $.when($.post('/composer/admin/getSecret', options)).done(function (_results)
                {
                $('#secret').empty(); $('#secret').append(_results.secret);
                $('#userID').empty(); $('#userID').append(_results.userID);
                $('#messages').append(formatMessage(_results));
            });
        });
        $('#member_list').on('change',function()
        { let id = $('#member_list').find(':selected').text();
        displayMember(id, member_list);
        });
    });

}


function displayMember(id, _list)
{
    let member = findMember(id, _list);
    $('#companyName').empty();
    $('#companyName').append(member.companyName);
    $('#participant_id').empty();
    $('#participant_id').append(member.id);
}


function findMember(_id, _list)
{
    let _mem = {'id': _id, 'companyName': 'not found'};
    for (let each in _list){(function(_idx, _arr)
    {
        if (_arr[_idx].id === _id)
        {_mem = _arr[_idx]; }
    })(each, _list);}
    return(_mem);
}

/**
 * get blockchain info
 */
function getChainInfo()
{
    $.when($.get('fabric/getChainInfo')).done(function(_res)
    { let _str = '<h2> Get Chain Info: '+_res.result+'</h2>';
        if (_res.result === 'success')
            {_str += 'Current Hash: '+formatMessage(_res.currentHash);
            _str+= '<ul><li>High: '+_res.blockchain.height.high+'</li><li>Low: '+_res.blockchain.height.low+'</li></ul>';}
        else
            {_str += formatMessage(_res.message);}
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * get History
 */
function getHistorian()
{
    $.when($.get('fabric/getHistory')).done(function(_res)
    { let _str = '<h2> Get History Records: '+_res.result+'</h2>';
        if (_res.result === 'success')
            {_str += 'Current length: '+formatMessage(_res.history.length);
            _str += '<table><tr><th>Transaction ID</th><th>Transaction Type</th><th>TimeStamp</th></tr>';
            _res.history.sort(function(a,b){return (b.transactionTimestamp > a.transactionTimestamp) ? -1 : 1;});
            for (let each in _res.history)
            {(function(_idx, _arr){
                let _row = _arr[_idx];
                _str += '<tr><td>'+_row.transactionId+'</td><td>'+_row.transactionType+'</td><td>'+_row.transactionTimestamp+'</td></tr>';
            })(each, _res.history);
            }
            _str +='</table>';
        }
        else
            {_str += formatMessage(_res.message);}
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}

/**
 * display blockchain updates
 */
function getChainEvents()
{
    $.when($.get('fabric/getChainEvents')).done(function(_res)
    { let _str = '<h2> Get Chain events requested. Sending to port: '+_res.port+'</h2>';
        let content = $('#blockchain');
        let csSocket = new WebSocket('ws://localhost:'+_res.port);
        csSocket.onopen = function () {csSocket.send('connected to client');};
        csSocket.onmessage = function (message) {
            _blctr ++;
            if (message.data !== 'connected')
            {$(content).append('<span class="block">block '+JSON.parse(message.data).header.number+'<br/>Hash: '+JSON.parse(message.data).header.data_hash+'</span>');
                if (_blctr > 4) {let leftPos = $(content).scrollLeft(); $(content).animate({scrollLeft: leftPos + 300}, 250);}
            }
        };
        csSocket.onerror = function (error) {console.log('WebSocket error: ' + error);};
        $('#admin-forms').empty();
        $('#admin-forms').append(_str);
    });
}
/**
 * display blockchain updates
 */
function displayAdminUpdate()
{
    let toLoad = 'adminHelp.html';
    $.when($.get(toLoad)).done(function(_page){$('#admin-forms').empty(); $('#admin-forms').append(_page);});
}