function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    var roomCode;
    
    $("#joinGroup").click(function() {
        roomCode = joinRoom($("#groupID").val(), database);
    });

    $("#makeGroup").click(function() {
        roomCode = makeRoom();
    });

    $("#skip").click(function() {
        createVote(database, roomCode)
    })
});