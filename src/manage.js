/* manage.js */


var bgPage = chrome.extension.getBackgroundPage();

$('document').ready(function(){
  var query = getQueryParams(document.location.search);

  if (query.redirect) {
    $("#message-bucket").text("Oops! "+ query.key +" goes nowhere!");
  }

  if (query.key) {
    // a key has been passed
    $("#form-key").val(query.key);
  }

  if (query.url) {
    // a url has been passed
    $("#form-url").val(query.url);
  }

  $("#form-submit").click(onFormSubmit);
  $("#form").keypress(function(event) {
    if(event.keyCode == 13){
        $("#form-submit").click();
    }
  });

  generateMapTable($("#table-container"));

});


/**
 Add key-url mapping to the map and redirect to success page
 on success.
*/
function onFormSubmit() {
  var key = $("#form-key").val()
  var url = $("#form-url").val()

  // TODO(callumchalk): do some validations

  // normalise url
  url = bgPage.normaliseURL(url);
  bgPage.addMapping(key,url, function() {
    // TODO(callumchalk): show an error if something went wrong

    // append new row to table
    var table = $("#table-container table");
    table.append(generateMapTableRow(key, url));

    // show success message
    $('body').append("<h2>Success!</h2>");
    $('body').append("Added {" + key + ": " +
      "<a href='" + url + "'>"+url+"</a>} to your mappings");
  });
}

function generateMapTableRow(key, url) {
  var delete_img = "img/ic_close_black_48dp_1x.png";

  var line = $("<tr>");
  line.append("<td>"+key+"</td>");
  line.append("<td><a href='"+url+"'>"+url+"</a></td>");
  var delete_btn = $("<img class='delete-btn'' "+
                 "src='"+delete_img+"'>");
  var btn_td = $("<td>");
  btn_td.append(delete_btn);
  line.append(btn_td);

  delete_btn.click(function(e) {
    var row = $(e.target).parents("tr");
    var key = row.children("td").first().text();
    bgPage.clearMapping(key);
    row.remove();
  });

  return line;
}

/**
 Create table showing all the current go links you have active
*/
function generateMapTable(element) {
  bgPage.getMappings(function(map) {
    table = $("<table border=1>");
    table.append("<tr><th>Key</th><th>URL</th><th></th></tr>");
    for (k in map) {
      var line = generateMapTableRow(k, map[k]);
      table.append(line);
    }
    element.append(table);
  });
}