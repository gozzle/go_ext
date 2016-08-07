/* manage.js */


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

  $("#form-submit").click(function(event) {
    if (!$(this).hasClass("disabled")) {
      onFormSubmit(event);
    }
  });

  $("#form").keypress(function(event) {
    if(event.keyCode == 13){
        $("#form-submit").click();
    }
  });

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

});

/**
 Inserts an alert into the #message-bucket area on the page
 with the appropriate alert level. Clears the alert if called
 with no arguments.

 Args:
  message - The message text to display
  alert_level - The alert level to use out of
                ["danger", "warning", "info", "success"]
*/
function setAlertMessage(message, alert_level) {
  var message_bucket = $("#message-bucket");

  if (!message) {
    // clear the bucket
    message_bucket.html(filler);
  } else {
    var c = "alert alert-" + alert_level + " fade in";
    var alert = $("<div class='" + c + "'>");
    alert.html(message);
    alert.append("<button class='close' data-dismiss='alert'"+
      " aria-label='close'>&times;</button>");

    message_bucket.append(alert);
  }
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