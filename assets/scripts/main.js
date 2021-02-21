$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    
    $("#joinGroup").click(function() {
        joinRoom($("#groupID").val(), database);
    });

    $("#makeGroup").click(function() {
        makeRoom();
    });
});