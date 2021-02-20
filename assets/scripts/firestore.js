
function setupFirebase() {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    return db;
}
