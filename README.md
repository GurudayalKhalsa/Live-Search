Live Search
=============

A javascript-based live search implementation (Requires jQuery)

###Demo: 

See demo folder

###Usage: 


include the livesearch.js and livesearch.css in your site's css.

    $(".search-field").livesearch({
        data: "text.json",

    });

- "data" is the data to saerch through. This can either be an array, or a JSON file of items. This entry is mandatory.

#### NOTE: Must be on a server for this to work with json files (uses ajax)

- "maxResults" defaults to 100 and is the maximum amount of results to be displayed on screen.
- "type" is the ranking of search. Can be regular or lazy, defaults to regular. If "type" === "regular", and user searches for "fctin", "function" will not be an answer if in data to search. But if "type" === "lazy", "function" will show up.
- "format" is the format of output. Uses simple handlebars/moustache-like syntax for variables. If input data is array of objects, each key in the objects can be specified within {} brackets. Otherwise, if array of standalone items, Anything specified within {} brackets will be the same value. E.g. if the latter mentioned before is true, and "format" === "<a href='#{hello}>{goodbye}</a>'>", for each item in array, the output would be <a href="#valueofkey">valueofkey</a>. Default format is "<a href='#{title}>{title}</a>'>"