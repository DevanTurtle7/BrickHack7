function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    var roomCode;

    $("#joinGroup").click(async function () {
        $("#makeGroup").hide();
        $("#joinGroup").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
        roomCode = await joinRoom($("#groupID").val(), database);
    });

    $("#makeGroup").click(async function () {
        $("#makeGroup").hide();
        $("#joinGroup").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
        roomCode = await makeRoom();
        
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

            var clientSecret = getClientSecret();
            var refreshToken = getRefreshToken();
            var accessToken = getAccessToken(clientSecret, refreshToken);

            nextSong(accessToken);
        }
    })
});