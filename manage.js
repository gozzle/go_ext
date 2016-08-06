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

  $("#clear-button").click(function() {
    var key = $("#form-clear").val();
    bgPage.clearMapping(key);
  });

});


/**
 Add key-url mapping to the map and redirect to success page
 on success.
*/
function onFormSubmit() {
  var key = $("#form-key").val()
  var url = $("#form-url").val()

  // TODO(callumchalk): do some validations
  bgPage.addMapping(key,url, function() {
    // TODO(callumchalk): show an error if something went wrong

    $('body').append("<h2>Success!</h2>");
    $('body').append("Added " + key + ": " +
      "<a href='" + url + "'>"+url+"</a> to your mappings");
  });
}