/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// z2c-utilities.js 


languages = {}, // getSupportedLanguages
selectedLanguage = {},
language = "",
textLocations = {}, // getTextLocations
textPrompts = {}

function updatePage(_page){
    console.log("Update Page >> ", _page);
    for (each in textPrompts[_page]){
        (function(_idx, _array){
            console.log("[#id]", _idx, "[#value]", getDisplaytext(_page, _idx))
            $("#"+_idx).empty();
            $("#"+_idx).append(getDisplaytext(_page, _idx));
        })(each, textPrompts[_page])
    }
}

function getDisplaytext(_page, _item){
    return (textPrompts[_page][_item]);
}

function goMultiLingual(_language, _page)
{ 
    console.log("Initialize populate front-end data.");

    language = _language;
    $.when($.get("/api/getSupportedLanguages")).done(function(_res){
        languages = _res;
        selectedLanguage = languages[_language];
        console.log("Selected langauge is", selectedLanguage.menu);
        var options = {};
        options.language = _language;
        $.when($.get('/api/getTextLocations'),$.post('/api/selectedPrompts', options)).done(function(_locations, _prompts){
            //console.log("Locations", _locations, "Prompts", _prompts);
            textLocations = _locations;
            textPrompts = JSON.parse(_prompts[0]);
            updatePage(_page);
        });

        var _choices = $('#lang_choices');
        _choices.empty();
        var _str = "";
        for(each in _res){
            (function(_idx, _array){
                if(_array[_idx].active == "yes")
                {
                    _str += '<li id="'+_idx+'"><a onClick="goMultiLingual(\''+_idx+'\', \'index\')">'+_array[_idx].menu+'</a></li>'
                }
            })(each, _res)
        }
        _choices.append(_str);
    })
  
}

function formatMessage(_msg) {return '<p class="message">'+_msg+'</p>';}


