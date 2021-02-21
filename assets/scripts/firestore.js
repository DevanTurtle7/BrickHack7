
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
        currently_playing: '',
        songIndex: 0,
        timestamp: 0,
        vote: []
    }

    if (roomExists == null) {
        const res = await db.collection('rooms').doc(roomCode).set(data);
        joinRoom(roomCode, db);
    } else {
        makeRoom();
    }

}

async function joinRoom(roomCode, database) {
    alert("You've Successfully joined the Room!");
    var clientSecret = await getClientSecret(database);
    var refreshToken = getRefreshToken();
    var accessToken = await getAccessToken(clientSecret, refreshToken);
    userId = await getUID(accessToken);
    localStorage.setItem("handlingVote", false);
    localStorage.setItem("creatingVote", false);

    await db.collection('rooms').doc(roomCode).update({
        Audience: firebase.firestore.FieldValue.arrayUnion(userId)
    });

    var data = await getRoomData(database, roomCode);

    if (data.Queue.length > 0) {
        var startTime = data.songStart;
        var currentTime = new Date();
        var currentTimeInSeconds = currentTime.getTime() / 1000;
        var diff = Math.round(Math.abs(currentTimeInSeconds - startTime.seconds));
        diff *= 1000;

        await playSong(accessToken, data.Queue[data.songIndex], diff);

        for (var i = data.songIndex + 1; i < data.Queue.length; i++) {
            console.log("i is " + i);
            console.log(data.Queue[i]);
            addToQueue(accessToken, data.Queue[i])
        }

        heartbeat(accessToken, data.songIndex, roomCode, database);
    }

    createVote(database, roomCode);
    listener(database, roomCode);
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
                    songStart: currentTime
                })
            }
        }
    }
}

async function listener(database, roomCode) {
    var docRef = await database.collection('rooms').doc(roomCode);

    database.collection("rooms").doc(roomCode).onSnapshot((doc) => {
        console.log("Current data: ", doc.data());

        var creatingVote = JSON.parse(localStorage.getItem('creatingVote'));
        var handlingVote = JSON.parse(localStorage.getItem('handlingVote'));

        if (doc.data().vote.time == null) {
            localStorage.setItem("handlingVote", false);
        } else if (!handlingVote && !creatingVote) {
            console.log("you have a vote pending");
            localStorage.setItem("handlingVote", true);

            var voted = false;

            $("#voteYes").click(function () {
                if (!voted) {
                    docRef.update({
                        "vote.yes": firebase.firestore.FieldValue.increment(1)
                    });
                }
                voted = true;
            });

            $("#voteNo").click(function () {
                if (!voted) {
                    docRef.update({
                        "vote.no": firebase.firestore.FieldValue.increment(1)
                    });
                }
                voted = true;
            });

        }
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
