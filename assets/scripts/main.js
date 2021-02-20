$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    
    $( "#joinGroup" ).click(function() {
        //alert($("#groupID").val());
        joinRoom($("#groupID").val());
    });
});

