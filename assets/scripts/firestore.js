
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
        Queue: ["Balls Deep", "Hello","Nex", "Song", "Here"],
        currently_playing: 'Balls Deep',
        timestamp: 0
    }

    if(roomExists == null){
        const res = await db.collection('rooms').doc(roomCode).set(data);
    }
    
    else{
        makeRoom();
    }

}

async function joinRoom(roomCode) {
    alert("You've Successfully joined the Room!");
}