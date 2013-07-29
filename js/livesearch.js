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
        $.get(obj.data, function(data)
        {
            obj.data = data;
            doLivesearch();
        });
    }

    else doLivesearch();

    var input = this;

    function doLivesearch()
    {
        var arr = obj.data.slice(0),
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

        obj.data = sortObject(obj.data, "name");
        if(obj.data[0]==="") obj.data = obj.data.slice(1);

        arr = obj.data.slice(0);

        input.on('keyup',function(event)
        {        
            if(storedValue === this.value)
            {
                return;
            }
            if(event.keyCode === UP || event.keyCode === DOWN || event.keyCode === ENTER) return;
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
                else if(this.value.length === storedValue.length-1 && arrcache.length>1 && this.value === storedValue.substr(0, storedValue.length-1))
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

            //exit if no results
            if( (results == 0) || event.keyCode === ESCAPE || (event.keyCode === BACKSPACE && !exists(this.value))) 
            {
                $(".searchResults").remove();
                return;
            }

            var elem = $(this);

            var html = "";
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
                $(".searchResults")[0].innerHTML=html;
            }    
            $(".searchResults li").hover(function()
            {
                $(".searchResults li.active").removeClass("active");
                $(this).toggleClass("active");
                currentlyActive = $(this).index();
            });    

            if(exists(obj.onload)) obj.onload($(".searchResults"));

            if(exists($(".searchResults")) && !exists($(".searchResults li.active")))
            {
                $($(".searchResults").find("li")[currentlyActive]).toggleClass("active");
            }
        });

        input.on('keydown',function(event)
        {
            var li = $(".searchResults").find("li");

            if(event.keyCode === ENTER && exists($(".searchResults")))
            {
                var a = $(li[currentlyActive]).find("a")[0];
                if(exists(a.href)) window.location.href=a.href;
            }

            else if(event.keyCode === DOWN && exists($(".searchResults")))
            {
                $(".searchResults li.active").removeClass("active");
                if(currentlyActive<li.length-1)currentlyActive++;
                $(li[currentlyActive]).toggleClass("active");
                $(li[currentlyActive])[0].scrollIntoView();
            }

            else if(event.keyCode === UP && exists($(".searchResults")))
            {
                $(".searchResults li.active").removeClass("active");
                if(currentlyActive>0)currentlyActive--;
                $(li[currentlyActive]).toggleClass("active");
                $(li[currentlyActive])[0].scrollIntoView();
            }
        });

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

    function getFormat(currentData)
    {
        if(!exists(obj.format) && !exists(currentData.name)) return "<a href='"+currentData+"'>"+currentData+"</a>";
        else if(!exists(obj.format) && exists(currentData.name))
        {
            return "<a href='"+currentData.name+"'>"+currentData.name+"</a>";
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
}
})();