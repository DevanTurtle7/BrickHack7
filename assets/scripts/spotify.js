function spotifyLogin() {
    location.replace('https://accounts.spotify.com/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirect_uri + '&scope=user-modify-playback-state');
}

function getCode() {
    var responseQuery = window.location.search // Get the code in the URL returned from the Spotify login
    // The regex for getting the code
    var re = /[&?]code=([^&]*)/

    try {
        var code = re.exec(responseQuery)[1] // Get the code
        return code;
    } catch {
        return null;
    }
}

async function login(database) {
    var code = getCode();

    if (code == null) {
        spotifyLogin();
    }

    var clientSecret = await getClientSecret(database);

    if (localStorage.getItem("refreshToken") == null) {
        var clientSecret = await getClientSecret(database);
        var data = await initializeTokens(clientSecret, code);

        localStorage.setItem("refreshToken", data.refresh_token);
    }

    var refreshToken = getRefreshToken();
    var accessToken = await getAccessToken(clientSecret, refreshToken);
    console.log(accessToken);
    var uri = "spotify:track:51RN0kzWd7xeR4th5HsEtW";
    //playSong(accessToken, uri);
    var id = await getUID(accessToken);
    console.log(id);
    var timestamp = await getTimestamp(accessToken);
    console.log(timestamp);
}

async function initializeTokens(clientSecret, code) {
    const result = new Promise(function (resolve, reject) { // Create a promise
        // Request the access token
        $.ajax({
            type: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            data: {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
            },
            headers: {
                // Headers as outline by the Spotify API
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + clientSecret)
            },
            success: function (data) {
                console.log(data);
                resolve(data) // Resolve the promise
            },
            error: function (data) {
                console.log('error getting token')
                console.log(data)
                reject('token error') // Reject the promise
            }
        })
    })

    return result // Return the response
}

function getRefreshToken() {
    var refreshToken = localStorage.getItem('refreshToken');
    return refreshToken
}

async function getAccessToken(clientSecret, refreshToken) {
    /*
    Get a refresh token
    Parameters:
        clientSecret: The Spotify API client secret
        refreshToken: The refresh token gotten from getToken()
    */
    const result = new Promise(function (resolve, reject) { // Create a promise
        $.ajax({
            type: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            data: {
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken,
            },
            headers: {
                // Headers as outline by the Spotify API
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + clientSecret)
            },
            success: function (data) {
                resolve(data.access_token); // Resolve the promise with the token
            },
            error: function (data) {
                console.log('error getting refresh token')
                reject('token refresh error') // Reject the promise
            }
        })
    })

    return result // Return the response
}

async function addToQueue(accessToken, uri) {
    // uri = spotify:track:51RN0kzWd7xeR4th5HsEtW
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: 'https://api.spotify.com/v1/me/player/queue?uri=' + uri,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken,
            },
            success: function (data) {
                console.log(data);
                resolve(data);
            }, error: function (data) {
                console.log("error");
                console.log(data);
            }
        })
    })

    return result;
}

async function nextSong(accessToken) {
    const result = new Promise(function (resolve, reject) { // Create a promise
        // Request the access token
        $.ajax({
            type: 'POST',
            url: 'https://api.spotify.com/v1/me/player/next',
            headers: {
                // Headers as outline by the Spotify API
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken,
            },
            success: function (data) {
                console.log(data);
                resolve(data) // Resolve the promise
            },
            error: function (data) {
                console.log('error getting token')
                console.log(data)
                reject('token error') // Reject the promise
            }
        })
    })

    return result // Return the response
}

async function playSong(accessToken, uri) {
    try {
        await addToQueue(accessToken, uri);
        await nextSong(accessToken);
    } catch {
    }
}

async function getUID(accessToken) {
    const result = new Promise(function(resolve, reject) {
        $.ajax({
            type: 'GET',
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            success: function(data) {
                console.log(data);
                resolve(data.id);
            }, error: function(data) {
                console.log('error getting uid');
                console.log(data);
                reject(data);
            }
        })
    })

    return result;
}

function getTimestamp(accessToken) {
    $.ajax({
        type: "GET",
        url: "https://api.spotify.com/v1/me/player",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
        },
        success: function(data) {
            console.log(data);
            resolve(data);
        }, error: function(data) {
            console.log('error getting timestamp')
            console.log(data);
            reject(data);
        }
    })
}

function setTimestamp() {

}