
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

        localStorage.setItem("handlingVote", false);
        localStorage.setItem("creatingVote", false);

        await playSong(accessToken, data.Queue[data.songIndex], diff);

        for (var i = data.songIndex + 1; i < data.Queue.length; i++) {
            console.log("i is " + i);
            console.log(data.Queue[i]);
            addToQueue(accessToken, data.Queue[i])
        }

    }

    createVote(database, roomCode);
}

async function heartbeat(accessToken, songIndex, roomCode, database) {
    var lastTimestamp = await getTimestamp(accessToken);
    var lastSongIndex = songIndex;

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

async function listener(roomCode){
    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error Calling the database ' + error)
    })
    var currentTime = new Date();
    var docRef = await  database.collection('rooms').doc(roomCode);
    database.collection("rooms").doc(roomCode)
    .onSnapshot((doc) => {
        console.log("Current data: ", doc.data());
        if (data.vote.length == 0) {
            localStorage.setItem("handlingVote", false);
        }
        else if(localStorage.getItem("handlingVote") == false && localStorage.getItem("creatingVote") == true){
            localStorage.setItem("handlingVote", true);
        }
    });
}

async function createVote(database, roomCode) {
    var timestamp = new Date();
    var data = await getRoomData(database, roomCode);
    var docRef = await database.collection('rooms').doc(roomCode);

    if (data.vote.length == 0) {
        localStorage.setItem("creatingVote", true);

        await docRef.update({
            vote: [{
                time: timestamp,
                yes: 0,
                no: 0,
            }]
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
                votes = data.vote[0].yes + data.vote[0].no;
                members = data.Audience.length;
            }

            var data = await getRoomData(database, roomCode);
            var totalVotes = data.vote[0].yes + data.vote[0].no;
            var voteResult = data.vote[0].yes / totalVotes >= 0.5;

            console.log(voteResult);
            resolve(voteResult)
        })

        return result;
    }

    return null
}
