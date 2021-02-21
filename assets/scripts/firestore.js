
function setupFirebase() {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    return db;
}

async function getClientSecret(db) {
    /*
    Gets the client secret from firestore
    */
    var docRef = db.collection('credentials').doc('client_secret')

    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error occurred getting secret. Trying again...')
        return getClientSecret()
    })

    return data.value
}

async function getRoomData(database, roomCode) {
    var docRef = await database.collection('rooms').doc(roomCode);
    data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log("Error getting room data")
        console.log(error)
        return null;
    })

    return data;
}

function randomCode() {
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var code = '';

    for (var i = 0; i < 4; i++) {
        var random = Math.floor(Math.random() * letters.length);
        code += letters[random];
    }

    return code;
}

async function makeRoom() {
    roomCode = randomCode();
    roomExists = await getRoomData(db, roomCode);

    const data = {
        Audience: [],
        Queue: [],
        songIndex: 0,
        timestamp: null,
        vote: []
    }

    if (roomExists == null) {
        const res = await db.collection('rooms').doc(roomCode).set(data);
        joinRoom(roomCode, db);
        return roomCode;
    } else {
        return makeRoom();
    }

}

async function startMusic(accessToken, database, roomCode) {
    var data = await getRoomData(database, roomCode)
    var startTime = data.timestamp;
    console.log(startTime);
    var currentTime = new Date();
    var currentTimeInSeconds = currentTime.getTime() / 1000;
    var diff = Math.round(Math.abs(currentTimeInSeconds - startTime.seconds));
    diff *= 1000;

    await playSong(accessToken, data.Queue[data.songIndex], diff);

    for (var i = data.songIndex + 1; i < data.Queue.length; i++) {
        console.log("i is " + i);
        console.log(data.Queue[i]);
        console.log("ERRRRRRRR");
        addToQueue(accessToken, data.Queue[i])
    }

    heartbeat(accessToken, data.songIndex, roomCode, database);
}

async function joinRoom(roomCode, database) {
    var clientSecret = await getClientSecret(database);
    var refreshToken = getRefreshToken();
    var accessToken = await getAccessToken(clientSecret, refreshToken);
    userId = await getUID(accessToken);
    localStorage.setItem("handlingVote", false);
    localStorage.setItem("creatingVote", false);

    await database.collection('rooms').doc(roomCode).update({
        Audience: firebase.firestore.FieldValue.arrayUnion(userId)
    });

    $("#addSong").click(async function () {
        addSongDB(database, roomCode, accessToken);
    });

    var data = await getRoomData(database, roomCode);

    if (data.Queue.length > 0) {
        startMusic(accessToken, database, roomCode);
    }

    listener(database, roomCode, clientSecret);

    return roomCode;
}

async function heartbeat(accessToken, songIndex, roomCode, database) {
    var lastTimestamp = await getTimestamp(accessToken);
    var lastSongIndex = songIndex;
    var docRef = await database.collection('rooms').doc(roomCode);

    console.log("starting heartbeat");

    while (true) {
        await sleep(1000);
        var data = await getRoomData(database, roomCode);
        var currentTimestamp = await getTimestamp(accessToken);
        var currentSongIndex = data.songIndex;

        if (currentTimestamp < lastTimestamp) {
            if (currentSongIndex == lastSongIndex) {
                var currentTime = new Date();

                docRef.update({
                    songIndex: currentSongIndex + 1,
                    timestamp: currentTime
                })
            }
        }
    }
}

async function listener(database, roomCode, clientSecret) {
    var docRef = await database.collection('rooms').doc(roomCode);
    var roomData = await getRoomData(database, roomCode);
    var numSongs = roomData.Queue.length;

    database.collection("rooms").doc(roomCode).onSnapshot(async function (doc) {
        var refreshToken = getRefreshToken();
        var accessToken = await getAccessToken(clientSecret, refreshToken);

        console.log("Current data: ", doc.data());

        var creatingVote = JSON.parse(localStorage.getItem('creatingVote'));
        var handlingVote = JSON.parse(localStorage.getItem('handlingVote'));
        var currentNumSongs = doc.data().Queue.length;

        console.log(currentNumSongs)
        console.log(numSongs);

        if (doc.data().vote.time == null) {
            localStorage.setItem("handlingVote", false);
        } else if (!handlingVote && !creatingVote) {
            console.log("you have a vote pending");
            localStorage.setItem("handlingVote", true);

            $("#votePrompt").show();

            var voted = false;

            $("#voteYes").click(function () {
                if (!voted) {
                    $("#votePrompt").hide();
                    docRef.update({
                        "vote.yes": firebase.firestore.FieldValue.increment(1)
                    });
                }
                voted = true;
            });

            $("#voteNo").click(function () {
                if (!voted) {
                    $("#votePrompt").hide();
                    docRef.update({
                        "vote.no": firebase.firestore.FieldValue.increment(1)
                    });
                }
                voted = true;
                
            });

            

            var vote = {};
            var data = await getRoomData(database, roomCode);

            while (data.vote.time != null) {
                await sleep(1000);
                data = await getRoomData(database, roomCode);
                if (data.vote.time != null) {
                    vote = data.vote;
                }
            }

            console.log("lastVote:");
            console.log(vote);

            var totalVotes = vote.yes + vote.no;
            if (vote.yes / totalVotes >= .5) {
                nextSong(accessToken);
            }

            $("#votePrompt").hide();
        }

        if (currentNumSongs > numSongs && currentNumSongs - 1 != doc.data().songIndex) {
            console.log('adding to queue');
            var uri = doc.data().Queue[currentNumSongs - 1];
            addToQueue(accessToken, uri)
        }

        if (currentNumSongs > numSongs && currentNumSongs == 1) {
            var uri = doc.data().Queue[0];
            playSong(accessToken, uri, 0);
        }

        numSongs = currentNumSongs;
    });
}

async function createVote(database, roomCode) {
    var timestamp = new Date();
    var data = await getRoomData(database, roomCode);
    var docRef = await database.collection('rooms').doc(roomCode);

    if (data.vote.time == null) {
        localStorage.setItem("creatingVote", true);

        await docRef.update({
            vote: {
                time: timestamp,
                yes: 1,
                no: 0,
            }
        })

        const result = new Promise(async function (resolve, reject) {
            var data = await getRoomData(database, roomCode);
            var diff = 0;
            var votes = 0;
            var members = data.Audience.length;

            while (diff < 15 && votes < members) {
                await sleep(1000);

                var data = await getRoomData(database, roomCode);
                var currentTime = new Date().getTime();
                var diff = Math.round((currentTime - timestamp.getTime()) / 1000);
                votes = data.vote.yes + data.vote.no;
                members = data.Audience.length;
            }

            var data = await getRoomData(database, roomCode);
            var totalVotes = data.vote.yes + data.vote.no;
            var voteResult = data.vote.yes / totalVotes >= 0.5;

            console.log(voteResult);
            localStorage.setItem('creatingVote', false);
            await docRef.update({
                vote: {}
            })
            resolve(voteResult)
        })

        return result;
    }

    return null
}

async function addSongDB(database, roomCode, accessToken) {
    var data = await getRoomData(database, roomCode);
    var uri = $("#songQueue").val();
    var noSongs = data.Queue.length == 0;

    await database.collection('rooms').doc(roomCode).update({
        Queue: firebase.firestore.FieldValue.arrayUnion(uri),
    });

    if (noSongs) {
        var currentTime = new Date();
        await database.collection('rooms').doc(roomCode).update({
            timestamp: currentTime
        });
        startMusic(accessToken, database, roomCode);
    }
}