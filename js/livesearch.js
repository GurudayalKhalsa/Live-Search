//JS Livesearch/Autocomplete
(function(){
$.fn.livesearch = function(obj)
{
    function exists(e)
    {
        if (typeof e === "undefined") return false;
        if (typeof e !== "function" && typeof e === "object" && (typeof e.length === "undefined" || e.length === 0)) return false;
        if (e === "" || e === 0 || e === null || e === undefined) return false;
        return true;
    }
    
    if (!exists(obj.data)) return;
    
    //load data from file if string (must be json format)
    if(typeof obj.data === "string")
    {
        $.getJSON(obj.data, function(data)
        {
            obj.data = data;
            doLivesearch();
        });
    }

    else doLivesearch();

    var input = this;

    function doLivesearch()
    {
        var arr = obj.data,
            arrcache = [],
            storedValue = input[0].value,
            maxResults = obj.maxResults||100,
            type = obj.type||"",
            BACKSPACE = 8, 
            DOWN = 40, 
            UP = 38, 
            ENTER = 13,
            ESCAPE = 27,
            currentlyActive = 0;

        if(obj.structure==="trie")
        {
            arr = new Trie(arr);
            trie = arr;
        }
        else
        {
            arr = obj.data.slice(0);
            obj.data = sortObject(obj.data, "name");
            if(obj.data[0]==="") obj.data = obj.data.slice(1);
            arr = obj.data.slice(0);
        }

        

        input.on('keyup',function(event)
        {        

            if(event.keyCode === UP || event.keyCode === DOWN || event.keyCode === ENTER) return;

            if(obj.structure === "trie" && exists(this.value)) 
            {
                var results = arr.get(this.value);
            }
            else
            {
                //get results
                if(exists(this.value) && storedValue !== this.value)
                {

                    //if typing forwards and last type is nothing
                    if(!exists(storedValue) && this.value.length > 0)
                    {
                        var results = findMatches(this.value, obj.data, type);
                        arr = obj.data.slice(0);
                        arrcache.push(results.slice(0));
                    }
                    //if typing forwards
                    else if(this.value.length > storedValue.length)
                    {
                        var results = arr = findMatches(this.value, arr, type);
                        arrcache.push(results.slice(0));
                    }
                    //when deleting multiple text, or when cache cleared and deleting (likely pressed back button)
                    else if((this.value.length < storedValue.length-1) || (this.value.length < storedValue.length && arrcache.length < this.value.length))
                    {
                        var results = findMatches(this.value, obj.data, type);
                        arr = obj.data.slice(0);
                    }
                    //when deleting one character
                    else if(this.value.length === storedValue.length-1 && arrcache.length===this.value.length+1 && arrcache.length>1 && this.value === storedValue.substr(0, storedValue.length-1))
                    {
                        arrcache.splice(arrcache.length-1, 1);
                        arr = arrcache[arrcache.length-1].slice(0);
                        var results = arr.slice(0);
                    }
                    //anything else, restart
                    else
                    {
                        arrcache = [];
                        var results = findMatches(this.value, obj.data, type);
                        arr = obj.data.slice(0);
                        arrcache.push(results.slice(0));
                    }
                }
                else
                {
                    arrcache = [];
                }
                storedValue = this.value;
            }

            //exit if no results
            if( (results == 0) || event.keyCode === ESCAPE || (event.keyCode === BACKSPACE && !exists(this.value))) 
            {
                $(".searchResults").remove();
                return;
            }

            var elem = $(this);
            var html = "";

            //organize and display results
            for (i in results)
            {
                if(i > maxResults) break;
                html+="<li>"+getFormat(results[i])+"</li>";
            }
            if(!exists($(".searchResults")))
            {
                var dropdown = document.createElement("ul");
                dropdown.innerHTML=html;
                dropdown = $(dropdown);
                dropdown.css({left:elem.offset().left, 
                              top:elem.offset().top+elem.outerHeight(),
                              'min-width':elem.outerWidth(),
                              'max-height': 400,
                              'overflow':'auto'
                });
                dropdown.addClass("searchResults");
                document.body.appendChild(dropdown[0]);
            }
            else if(exists($(".searchResults")) && exists(results))
            {
                $(".searchResults").show()[0].innerHTML=html;
            }    

            var oldMouseY = 0;

            //add functionality to results div

            $(".searchResults li").mouseenter(function(e)
            {
                //make sure when scrolling with arrow keys, that no sudden hovers when scrolling into view
                if(e.clientY === oldMouseY) return;
                oldMouseY = e.clientY;

                $(".searchResults li.active").removeClass("active");
                $(this).addClass("active");
                currentlyActive = $(this).index();
                setValue($(".searchResults li.active"));
            });  

            if(exists(obj.onload)) obj.onload($(".searchResults"));

            if(exists($(".searchResults")) && !exists($(".searchResults li.active")))
            {
                currentlyActive = 0;
                $($(".searchResults").find("li")[currentlyActive]).toggleClass("active");
            }
        });

        //allow up/down arrows to control current active result, enter to submit
        input.on('keydown',function(event)
        {
            var li = $(".searchResults").find("li");

            if(event.keyCode === ENTER && exists($(".searchResults")))
            {
                //set value to first result
                setValue($(".searchResults li.active"));

                var a = $(li[currentlyActive]).find("a")[0];
                if(exists(a.href)) window.location.href=a.href;
            }

            else if(event.keyCode === DOWN && exists($(".searchResults")))
            {
                $(".searchResults li.active").removeClass("active");
                if(currentlyActive<li.length-1)currentlyActive++;
                $(li[currentlyActive]).toggleClass("active");
                if(!activeIsInParent())$(li[currentlyActive])[0].scrollIntoView(false);
                setValue($(".searchResults li.active"));
            }

            else if(event.keyCode === UP && exists($(".searchResults")))
            {
                $(".searchResults li.active").removeClass("active");
                if(currentlyActive>0)currentlyActive--;
                $(li[currentlyActive]).toggleClass("active");
                if(!activeIsInParent())$(li[currentlyActive])[0].scrollIntoView(true);
                setValue($(".searchResults li.active"));
                event.preventDefault();
            }
            else if(exists($(".searchResults")) && currentlyActive!==0)
            {
                $(".searchResults li.active").removeClass("active");
            }
        });

        function activeIsInParent()
        {
            //if active top > results top and active bottom < results bottom
            var parentTop    = $(".searchResults").offset().top,
                childTop     = $(".searchResults li.active").offset().top,
                parentHeight = $(".searchResults").outerHeight(),
                childHeight  = $(".searchResults li.active").outerHeight();

            return ( parentTop < childTop && (parentTop+parentHeight) > (childTop+childHeight) );
        }

        window.onclick=function(e)
        {
            //hide on click outside of input, reshow on click in
            if(input.offset().left<e.clientX && e.clientX < parseInt(parseInt(input.offset().left)+parseInt(input.outerWidth())) && input.offset().top<e.clientY && e.clientY < parseInt(parseInt(input.offset().top)+parseInt(input.outerHeight()))) 
            {
                $(".searchResults").show();
            }
            else 
            {
                $(".searchResults").hide();
            }
            
        };
    }

    function setValue(el)
    {
        var value = el.find("[data-livesearch-value]").attr("data-livesearch-value")||el.text();
        input[0].value = value;
    }

    function getFormat(currentData)
    {
        if(!exists(obj.format) && !exists(currentData.name)) return "<a data-livesearch-value='"+currentData+"'>"+currentData+"</a>";
        else if(!exists(obj.format) && exists(currentData.name))
        {
            return "<a data-livesearch-value='"+currentData.name+"'>"+currentData.name+"</a>";
        }
        else if(exists(obj.format) && !exists(currentData.name))
        {
            if(obj.format.match("}{")!==null) return;
            var text = obj.format.split( /[{}]/ );
            if(obj.format[0]==="{") var start = 0;
            else var start = 1;
            for(var i = start; i < text.length; i+=2)
            {
                text[i] = currentData;
                if(obj.capitalize) text[i].capitalize();
            }    
            text = text.join("");
            return text;    
        }
        else
        {
            if(obj.format.match("}{")!==null) return;
            var text = obj.format.split( /[{}]/ );
            if(obj.format[0]==="{") var start = 0;
            else var start = 1;
            for(var i = start; i < text.length; i+=2)
            {
                if(text[i].match(/[+]/)!==null)
                {
                    text[i] = text[i].split("+");
                    for (j in text[i]) text[i][j] = currentData[text[i][j]];
                    text[i] = text[i].join("");
                }
                else
                {
                    text[i] = currentData[text[i]];
                }
                if(obj.capitalize) text[i].capitalize();
            }
            text = text.join("");
            return text;
        }
    }

    function sortObject(arr, key) 
    {    
        if(typeof arr[0] === "object" && exists(arr[0][key]))
        {
            return arr.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
        else return arr.sort();
    }

    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    //only for words, haystack must be sorted
    function findMatches(needle, haystack, type, maxResults)
    {
        String.prototype.livesearch_hasMatch=function(needle, type)
        {
            String.prototype.livesearch_score=function(e,t){t=t||0;if(e.length==0)return.9;if(e.length>this.length)return 0;for(var n=e.length;n>0;n--){var r=e.substring(0,n);var i=this.indexOf(r);if(i<0)continue;if(i+e.length>this.length+t)continue;var s=this.substring(i+r.length);var o=null;if(n>=e.length)o="";else o=e.substring(n);var u=s.score(o,t+i);if(u>0){var a=this.length-s.length;if(i!=0){var f=0;var l=this.charCodeAt(i-1);if(l==32||l==9){for(var f=i-2;f>=0;f--){l=this.charCodeAt(f);a-=l==32||l==9?1:.15}}else{a-=i}}a+=u*s.length;a/=this.length;return a}}return 0}

            if(type === "lazy") return this.livesearch_score(needle) > 0;
            return (this.match(new RegExp('^'+needle,"i"))!==null || this.match(new RegExp(' '+needle, 'i'))!==null)
        }
        
        var newHaystack = [],
            max = haystack.length-1,
            min = 0,
            i = Math.floor((max+min)/2),
            text = getCurrentHaystackText(); 
        

        function getCurrentHaystackText()
        {
            if(typeof haystack[i] === "object" && exists(haystack[i].name)) return haystack[i].name;
            else return haystack[i];
        }

        //find general upper/lower bounds (binary search)
        
        var tick = 0;

        while (exists(text) && !text.livesearch_hasMatch(needle, type))
        {
            tick++;

            text = getCurrentHaystackText();

            if(!exists(text)) break;

            if(text.length >= needle.length && !text.livesearch_hasMatch(needle, type))
            {
                if(text > needle)
                {
                    max = i;
                    i = Math.floor((max+min)/2)
                }

                else if(text < needle)
                {
                    min = i;
                    i = Math.floor((max+min)/2);
                }
            } 
            if(min===max || tick > 50) break;
        }
        if(exists(maxResults) && max > maxResults) max = maxResults;

        //find precise bounds and make new array
        for(var i = min; i <= max; i++)
        {
            var text = haystack[i];

            if(getCurrentHaystackText().livesearch_hasMatch(needle, type))
            {
                newHaystack.push(text);
            }
        }
        return newHaystack;
    }
    /* Trie.js
     * A simple Trie implementation written in JS, with robust built in functions for managing strings
     * Licensed under the MIT licence
     * Created by Gurudayal Khalsa
    */
    function Trie(wordlist)
    {
        //the trie
        var trie = {};
        var endString = "|";

        //returns the part of the trie object at the last character of the string.
        //if no string, returns the whole trie
        this.getObject = function(string)
        {
            if(!string) return trie;
            var charsDone = "";
            var currentObj = trie;
            for(var i = 0; i < string.length; i++)
            {
                var char = string[i];
                if(currentObj[char]) currentObj=currentObj[char];
                else return false;
            }

            if(currentObj !== trie)
            {
                return currentObj;
            }

            return false;
        }

        //returns all matching strings (that are or start with string) in array form from string specified. If no string, returns all strings in trie
        //string param can also be array, will return object of arrays
        this.get = function(string)
        {
            //handle if string is array/object
            if(typeof string === "object") 
            {
                var strings = {};
                for(var i in string) strings[string[i]]=this.get(string[i]);
                return strings;
            }

            if(typeof string !== "string" && string !== undefined) return [];

            var currentObj = this.getObject(string);
            if(typeof string === "string" && !currentObj) return [];



            currentObj = currentObj||trie;
            var strings = [];


            function findAllRecursive(currentObj)
            {
                if(currentObj[endString] && !strings[currentObj[endString]]) strings.push(currentObj[endString]);
                if(hasChildrenObjects(currentObj)) for(var i in childrenObjects(currentObj)) findAllRecursive(currentObj[i]);
                else return;
            }

            findAllRecursive(currentObj);        

            return strings;
        }    

        //insert a string into the trie (param can be array/object of strings instead)
        this.insert = function(string)
        {
            //handle if string is array/object
            if(typeof string === "object") 
            {
                for(var i in string) this.insert(string[i]);
                return true;
            }

            if(typeof string !== "string") return false;

            var charsDone = "";
            var currentObj = trie;

            for(var i = 0; i < string.length; i++)
            {
                var char = string[i];

                //if current object does not have an entry at current character, and string is not finished
                //add an empty object to the current object, with char of the current character
                if(!currentObj[char] && charsDone !== string) currentObj[char] = {};
                
                //update the list of characters done adding for this string
                charsDone+=char;

                //if string is done, add block to object to specify that string is done
                //the current object must be the last character of this string
                if(charsDone === string) 
                {
                    currentObj[char][endString]=string;
                }
                //update current object
                currentObj=currentObj[char];
            }

            return true;
        }

        //remove a string from the trie (param can be array/object of strings instead)
        //if all is true, then the objects of strings entered that are not valid words in the trie will be removed (e.g. removing "a" will remove all words that start with "a")
        this.remove = function(string, all)
        {
            //handle if string is array/object
            if(typeof string === "object") 
            {
                for(var i in string) this.remove(string[i]);
                return true;
            }

            if(typeof string !== "string") return false;

            var all = all||false;

            var currentObj = this.getObject(string);
            //return false if string not in trie, string must be a valid word, and all is false
            if((typeof string === "string" && this.getObject(string)===false) || (!this.has(string) && all===false && currentObj[endString]!==string)) return false;

            //if string in trie, but is not a word inside, delete
            if(!this.has(string) && all===true && currentParent[string])
            {
                delete currentParent[string];
                return true;
            }
            //otherwise, if string not in trie, and all is not true, return false
            else if(!this.has(string) && all===false) return false;

            //if there are children underneath the string, only delete the string (or delete all  children if specified)
            if(currentObj[endString] && currentObj[endString]===string) delete currentObj[endString];

            var currentParent = parent(currentObj, string, trie);
            if(hasChildrenObjects(currentObj)) 
            {
                //remove all matches if specified
                if(all===true)for(var i in currentObj) delete currentObj[i];
                //if this object is the only child of its parent, return
                if(childrenLength(currentParent)===1 && currentParent[string[string.length-1]])return true;
            }

            //otherwise, loop backwards and delete all objects that are characters of this string that do not have additional children
            for(var i = string.length-1; i>=0; i--)
            {
                var char = string[i];
                var currentParent = parent(currentObj, string, trie);            
                if(childrenLength(currentParent)>=1 && currentParent[char]) 
                {
                    delete currentParent[char];
                    if(childrenLength(currentParent)>=1)return true;
                }
                currentObj = currentParent;
            }

            return true;
        }

        //will return a boolean based on whether the string is in the trie or not
        //can handle objects, will return an object of whether or not each string is in trie
        this.has = function(string)
        {
            //handle if string is array/object
            if(typeof string === "object") 
            {
                var strings = {};
                for(var i in string) strings[string[i]]=this.has(string[i]);
                return strings;
            }

            if(typeof string !== "string") return false;

            var arr = this.getObject(string);
            //return false if string not in trie
            if(typeof string === "string" && !arr) return false;
            if(arr[endString] && arr[endString]===string) return true;
            return false;
        }

        //INITIALIZE
        //if data is object, convert whole of data into this Trie
        this.insert(wordlist);

        //Helper functions

        //determina if the object has direct children that are objects
        function hasChildrenObjects(obj)
        {
            if(obj.length===0) return false;
            for(var i in obj) if(typeof obj[i] === "object") return true;
            return false;    
        }

        //get all the children that are objects
        function childrenObjects(obj)
        {
            var objects = {};
            for(var i in obj)
            {
                if(obj[i]!==endString) objects[i]=obj[i];
            }
            return objects;
        }  

        //find the amount of direct children
        function childrenLength(obj)
        {
            var count = 0;
            for(var i in obj)
            {
                count++;
            }
            return count;
        }

        //find the parent of the object, given the string the object is on and root object
        function parent(obj, string, root)
        {
            var charsDone = "";
            var currentObj = root;
            var pastObjects = [];

            for(var i = 0; i < string.length; i++)
            {
                var char = string[i];
                if(currentObj[char]) 
                {
                    pastObjects.push(currentObj);
                    currentObj=currentObj[char];
                }
                else return false;

                if(currentObj===obj) return pastObjects.pop();
            }
        } 
        //copy the javascript object(does not copy functions inside)
        function copy(obj)
        {
            return JSON.parse(JSON.stringify(obj));
        }
    }


}
})();