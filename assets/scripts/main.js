function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    var roomCode;

    $("#joinGroup").click(async function () {
        $("#startPage").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
        $("#label2").show();
        $("#songQueue").show();
        roomCode = await joinRoom($("#groupID").val(), database);
        $("#roomInfo").text("Room Code: " + roomCode);
        $("#roomInfo").show();
    });

    $("#makeGroup").click(async function () {
        $("#startPage").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
        $("#label2").show();
        $("#songQueue").show();
        roomCode = await makeRoom();
        $("#roomInfo").text("Room Code: " + roomCode);
        $("#roomInfo").show();
        
    });

    $("#skip").click(async function () {
        console.log(roomCode);
        var votePassed = await createVote(database, roomCode)

        if (votePassed) {
            var docRef = await database.collection('rooms').doc(roomCode);
            var currentTime = new Date();

            docRef.update({
                songIndex: firebase.firestore.FieldValue.increment(1),
                timestamp: currentTime
            })

            var clientSecret = await getClientSecret(database);
            var refreshToken = getRefreshToken();
            var accessToken = await getAccessToken(clientSecret, refreshToken);

            nextSong(accessToken);
        }
    })
});