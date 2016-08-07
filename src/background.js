/* background.js */

/**
* Default landing page when a shortcut doesn't resolve
*/
var DEFAULT_HANDLER = "manage.html";

/**
* When a user types 'go xyz', try and retrieve gomap.xyz from
* storage. Redirect them to the correct page if possible, otherwise
* take them to our 'page not found' page, where they can add a link
* or google search for it.
*
*/
function keywordRedirect(text, disposition) {
  // look up text in storage to get the relevant redirect url
  chrome.storage.sync.get(text, function(items){
    var url;
    if (chrome.runtime.lastError || !items[text]) {
      // failed to get a url for that text.
      // redirect to default handling page
      url = DEFAULT_HANDLER + "?redirect=true&"+
            "key="+ encodeURIComponent(text);
    } else {
      url = items[text]
    }

    // change behaviour according to the disposition
    switch (disposition) {
      case "currentTab":
        chrome.tabs.update({"url": url});
        break;
      case "newForegroundTab":
        chrome.tabs.create({"url": url});
        break;
      case "newBackgroundTab":
        chrome.tabs.create({
          "url": url,
          "active": false
        });
        break;
    }
  });
}


/**
* General purpose exception.
* TODO(callumchalk): make more specific in future
*/
function GoExtException(message) {
  this.message = message;
  this.name = "GoExtException";
}

/**
  Fix URLs which are missing a protocol, by defaulting
  to http. Will mess up if the url includes a port number, but no
  protocol.

  Args:
    url  A url string to be normalised
  Returns:
    string  Normalised url string
*/
function normaliseURL(url) {

  var parser = document.createElement('a');
  parser.href = url;
  if (parser.protocol == "chrome-extension:") {
    parser.href = "http://" + url;
  }
  return parser.href;
}

/**
* Add a new redirection mapping to storage.
* Handles 1:1, and many:1, as well as multiple 1:1 mappings.
* 
* Args:
*   keys  A string or array of strings corresponding to the shortcut
*         text to be used for redirection
*   urls  A url or array of urls corresponding to the relevant redirects
*/
function addMapping(keys, urls, callback) {



  function addSingleMapping(key, url, callback) {
    var item = {};
    item[key] = normaliseURL(url);
    chrome.storage.sync.set(item);

    callback();
  }

  function addManyToOne(keys, url, i, callback) {
    if (i < keys.length) {
      addSingleMapping(keys[i], url, 
        addManyToOne(keys, url, ++i, callback));
    } else {
      callback();
    }
  }

  function addManyToMany(keys, urls, i, callback) {
    if (i < keys.length) {
      addSingleMapping(keys[i], urls[i],
        addManyToMany(keys, urls, ++i, callback));
    } else {
      callback();
    }
  }

  if( Object.prototype.toString.call(keys) === '[object Array]' ) {
    if (Object.prototype.toString.call(urls) !== '[object Array]') {
      if (typeof(urls) === 'string') {
        // array of keys mapping to single url. This is fine
        addManyToOne(keys, urls, 0, callback)
      } else {
        // don't know what's been passed, but it's wrong
        throw GoExtException("addMapping received urls of incompatible "+
          "type " + Object.prototype.toString.call(urls));
      }
    } else {
      // array of keys mapping to array of urls - check it's 1:1
      if (keys.length != urls.length) {
        throw GoExtException("must have 1:1 mapping between keys and" +
          " urls when adding multiple redirects at a time.");
      } else {
        // add 1:1 mappings. This is fine.
        addManyToMany(keys, urls, 0, callback);
      }
    }
  } else {
    if (typeof(keys) === 'string') {
      if (typeof(urls) === 'string') {
        // Single mapping. This is fine
        addSingleMapping(keys,urls, callback);
      } else {
        // can only have a single url for a single key
        throw GoExtException("Only one key passed for url mapping of "+ 
          "type " + Object.prototype.toString.call(urls));
      }
    } else {
      // non-string, non-array key
      throw GoExtEception("Non-string, non-array key passed for mapping");
    }
  }
}


function clearMapping(key) {
  if (!key) {
    chrome.storage.sync.clear();
  } else {
    chrome.storage.sync.remove(key);
  }
}

function getMappings(callback) {
  chrome.storage.sync.get(null, callback);
}

function openManagement() {
  chrome.tabs.create({
    url: "manage.html"
  })
}


// register event handler
chrome.omnibox.onInputEntered.addListener(keywordRedirect);

// activate browserAction button
chrome.browserAction.onClicked.addListener(openManagement);
