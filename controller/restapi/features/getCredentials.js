'use strict';
var fs = require('fs');
var path = require('path');

exports.getOneServiceCred = function(name) {
   if (process.env.VCAP_SERVICES) {
     console.log(process.env.VCAP_SERVICES);
      var services = JSON.parse(process.env.VCAP_SERVICES);
      for (var service_name in services) {
         if (service_name.indexOf(name) === 0) {
            var service = services[service_name][0];
            var creds = {};
            for (each in services[service_name][0].credentials)
            {(function(_each, _creds){creds[_each]=_creds[_each]})(each, services[service_name][0].credentials)}
            return creds;
         }
      }
   }
   else{return {}};
};
exports.getServiceCreds = function(req, res, next)
{
  if (process.env.VCAP_SERVICES)
    {
      var addConfig = {};
      var serviceList = require('../../env_2.json')
      for (each in serviceList) { console.log("each is: "+each+" with value: "+serviceList[each]);
        (function(_each) {addConfig[_each]=getCredentials.getServiceCreds(_each)})(each)}
      for (each in addConfig)
        {console.log("each is: "+each+" with value: "+addConfig[each]);
          (function(_each, _config)
          {for (param in _config[_each])
            {(function(_param, __each, __config)
              {var newCreds = _config[__each][_param];
                if (Object.keys(newCreds).length === 0 && newCreds.constructor === Object)
                {}else
                { serviceList[__each][_param]= _config[__each][_param]} })(param, _each, _config)}})(each, addConfig)}
        var config = serviceList;
    }
  else{var _path = path.join(path.dirname(require.main.filename),'controller','env.json');
    var config = fs.readFileSync(_path, "utf8");
  }
  res.send(config);
}
