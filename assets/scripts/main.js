function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    var roomCode;
    
    $("#joinGroup").click(function() {
        roomCode = joinRoom($("#groupID").val(), database);

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
        roomCode = makeRoom();

    });

    $("#skip").click(function() {
        createVote(database, roomCode)
    })
});