/* manage.js */

var KEYCODE_ENTER = 13;
var KEYCODE_ESCAPE = 27;

var bgPage = chrome.extension.getBackgroundPage();

$('document').ready(function(){
  var query = getQueryParams(document.location.search);

  if (query.redirect) {
    setAlertMessage("Oops! "+ query.key +" goes nowhere!",
                    "danger");
  }

  if (query.key) {
    // a key has been passed
    $("#form-key").val(query.key);
  }

  if (query.url) {
    // a url has been passed
    $("#form-url").val(query.url);
  }

  // wire up form submission
  $("#form-submit").click(function(event) {
    if (!$(this).hasClass("disabled")) {
      onFormSubmit(event);
    }
  });

  // wire up 'enter' key to submit form
  $("#form").keypress(function(event) {
    if(event.keyCode == KEYCODE_ENTER){
        $("#form-submit").click();
    }
  });

  // make form submission enabled/disabled depending
  // if there's enough text in the boxes
  $("#form input").bind('input propertychange',
    function(event) {
      // activate/disable submit button
      formkey = $("#form-key");
      formurl = $("#form-url");
      formsub = $("#form-submit");

      if (formkey.val() != "" && 
          formurl.val() != "") {
        if(formsub.hasClass("disabled")) {
          formsub.removeClass("disabled");
        }
      } else if (!formsub.hasClass("disabled")) {
        formsub.addClass("disabled")
      }
    }
  );

  generateMapTable($("#table-container"));

  // wire up escape key to dismiss all alerts
  $(document).keyup(function(event) {
    if (event.keyCode == KEYCODE_ESCAPE) {
      $("#message-bucket .alert").alert("close");
    }
  });

});

/**
 Inserts an alert into the #message-bucket area on the page
 with the appropriate alert level. Does nothing if called
 with no message. Defaults to "info" level alerting.

 Args:
  message - The message text to display
  alert_level - The alert level to use out of
                ["danger", "warning", "info", "success"]
                Defaults to "info".
*/
function setAlertMessage(message, alert_level) {

  // do nothing if no args
  if (!message) {
    return;
  }

  //default alert level = info
  if (!alert_level) {
    alert_level = "info";
  }

  var message_bucket = $("#message-bucket");

  // alert starts off hidden before sliding in above the others
  var alert = $("<div class='alert fade in' style='display:none'>"+
                "<button class='close' data-dismiss='alert' "+
                "aria-label='close'>&times;</button></div>");
  alert.append(message);
  alert.addClass("alert-" + alert_level);
  message_bucket.prepend(alert);

  // show the alert with a slide down
  alert.slideDown(100, function() {
    // wait for 2s then dismiss
    setTimeout(function(){
      alert.alert('close');
    }, 2000);
  });
}

/**
 Add key-url mapping to the map and redirect to success page
 on success.
*/
function onFormSubmit() {
  var key = $("#form-key").val()
  var url = $("#form-url").val()

  // TODO(callumchalk): do some validations

  // normalise url
  var url = bgPage.normaliseURL(url);
  var linkHtml = "<a href='"+url+"'>"+url+"</a>";
  bgPage.addMapping(key,url, function() {
    // TODO(callumchalk): show an error if something went wrong

    var table = $("#table-container table");
    var existingRow = table.find("tr[key='"+key+"']");
    if (existingRow.length == 0) {
      // append new row to table
      table.append(generateMapTableRow(key, url));
    } else {
      // key already exists. Replace existing url instead
      var urlbox = existingRow.children("td").get(1);
      $(urlbox).html(linkHtml);
    }

    //pulse new row green to highlight
    addedRow = table.find("tr[key='"+key+"']");
    addedRow.addClass("pulse-success")
      .delay(1000).queue(function(next){
        $(this).removeClass("pulse-success");
      next();
    });

    // show success message
    setAlertMessage("Added \"" + key + "\" &rarr; " +
      "\""+linkHtml+"\" to your mappings",
      "success");
  });
}

/**
 Create single row of the go link table, with the given key
 and url.

 Args:
  key - go shortcut
  url - target of go shortcut.
*/
function generateMapTableRow(key, url) {
  var line = $("<tr key='"+key+"'>");
  line.append("<td>"+key+"</td>");
  line.append("<td><a href='"+url+"'>"+url+"</a></td>");

  var delete_btn = $("<button type='button'"+
    " class='btn btn-xs btn-danger'>"+
    "<span class='glyphicon glyphicon-remove'></span>"+
    "</button>");
  var btn_td = $("<td class='text-center'>");
  btn_td.append(delete_btn);
  line.append(btn_td);

  delete_btn.click(function(e) {
    var row = $(e.target).parents("tr");
    var key = row.children("td").first().text();
    bgPage.clearMapping(key);
    row.remove();
    setAlertMessage("Successfully removed mapping for \""+key+"\"",
      "success");
  });

  return line;
}

/**
 Create table showing all the current go links you have active

 Args:
  element - the DOM element into which to insert the table
*/
function generateMapTable(element) {
  bgPage.getMappings(function(map) {
    var table = element.children('table').first();
    table.children('thead').first()
      .append("<tr><th>Key</th><th>URL</th><th></th></tr>");
    var tbody = table.children('tbody').first();
    for (k in map) {
      var line = generateMapTableRow(k, map[k]);
      tbody.append(line);
    }
  });
}