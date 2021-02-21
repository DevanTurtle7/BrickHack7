function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    
    $("#joinGroup").click(function() {
        joinRoom($("#groupID").val(), database);
    });

    $("#makeGroup").click(function() {
        makeRoom();
    });

    $("#suggest").click(function() {
        alert($("#songQueue").val());
    });
    
});