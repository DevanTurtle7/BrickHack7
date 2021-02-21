function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    
    $("#joinGroup").click(function() {
        joinRoom($("#groupID").val(), database);
        $("#makeGroup").hide();
        $("#joinGroup").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
    });

    $("#makeGroup").click(function() {
        makeRoom();
        $("#makeGroup").hide();
        $("#joinGroup").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
    });
});