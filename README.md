Live Search
=============

A javascript-based live search implementation (Requires jQuery)

###Demo: 

This repo, app.js.

###Usage: 


include the livesearch.js and livesearch.css in your site's css.

    $(".search-field").livesearch({
        data: "text.json",
        maxResults: 20,
        type: "normal",
        onload:function(obj)
        {
            obj.doSomething();
        },
        format:"<a data-livesearch-value='#{title}'>{title}</a>'>",
        structure:"trie"
    });

###Parameters:

- "data" is the data to search through. This can either be an array, or a JSON file of items. This entry is mandatory.

#### NOTE: Must be on a server for this to work with json files (uses ajax)

- "maxResults" defaults to 100 and is the maximum amount of results to be displayed on screen.
- "type" is the ranking of search. Can be regular or lazy, defaults to regular. If "type" === "regular", and user searches for "fctin", "function" will not be an answer if in data to search. But if "type" === "lazy", "function" will show up.
- "structure" - what data structure you want your list to be in. Defaults to nothing, trie only necessary if thousands of words in data set, and only use when storing words alone (will likely not work with "format")
- "format" is the format of output. Uses simple handlebars/moustache-like syntax for variables. If input data is array of objects, each key in the objects can be specified within {} brackets. Otherwise, if array of standalone items, Anything specified within {} brackets will be the same value. 
- **NOTE:** if a format is specified, you must include data-livesearch-value as an attribute somewhere in the custom format.


E.g. if the latter mentioned before is true, and "format" is:

    <a href='#{hello} data-livesearch-value='#{poop}'>{goodbye}</a>'>

for each item in array, the output would be:
    
    <a href="#key" data-livesearch-value='#{anotherkey}'>someotherkey</a>

Default format is 

    <a data-livesearch-value='{title}' href='#'>{title}</a>'>

- "onload" calls the callback function passed in when the search results are displayed. The callback function is passed the jQuery object of the search results DOM object as a parameter.
