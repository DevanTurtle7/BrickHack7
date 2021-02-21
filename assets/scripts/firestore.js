
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

async function getRoom(db, roomCode) {
    /*
    Gets the room  from firestore
    */
    var docRef = db.collection('rooms').doc(roomCode)

    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error occurred getting room. Trying again...')
        return null
    })

    return data
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
    roomExists = await getRoom(db, roomCode);

    const data = {
        Audience: [],
        Queue: [],
        currently_playing: '',
        timestamp: 0
    }

    if(roomExists == null){
        const res = await db.collection('rooms').doc(roomCode).set(data);
    } else{
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

    var docRef = await database.collection('rooms').doc(roomCode);
    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error occurred getting secret. Trying again...')
        return getClientSecret()
    })

    console.log(data.currently_playing);
    console.log(data.timestamp);

<<<<<<< HEAD
    playSong(accessToken, data.currently_playing, data.timestamp);
=======
    var startTime = data.songStart;
    console.log(startTime)

    var currentTime = new Date();
    var currentTimeInSeconds = currentTime.getSeconds();

    var diff = Math.abs(currentTimeInSeconds - startTime);
    console.log(diff);
    playSong(accessToken, data.currently_playing, diff);


>>>>>>> b11697f456a67a7e077c7ad7c37ccd42938721f6
}