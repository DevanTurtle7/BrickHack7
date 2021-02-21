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
    //var timestamp = await setTimestamp(accessToken, 180537);
    //console.log(timestamp);
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
                reject(data);
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

async function playSong(accessToken, uri, timestamp) {
    try {
        await addToQueue(accessToken, uri);
        await nextSong(accessToken);

        if (typeof timestamp != undefined) {
            await setTimestamp(accessToken, timestamp);
        }
    } catch {}
}

async function getUID(accessToken) {
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            success: function (data) {
                console.log(data);
                resolve(data.id);
            }, error: function (data) {
                console.log('error getting uid');
                console.log(data);
                reject(data);
            }
        })
    })

    return result;
}

async function getTimestamp(accessToken) {
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: "GET",
            url: "https://api.spotify.com/v1/me/player/currently-playing",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            success: function (data) {
                //console.log(data);
                resolve(data.progress_ms);
            }, error: function (data) {
                console.log('error getting timestamp')
                console.log(data);
                reject(data);
            }
        })
    })

    return result;
}

function setTimestamp(accessToken, ms) {
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: "PUT",
            url: "https://api.spotify.com/v1/me/player/seek?position_ms=" + ms,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken
            }, success: function (data) {
                console.log(data);
                resolve(data);
            }, error: function (data) {
                console.log(data);
                resolve(data);
            }
        })
    })

    return result;
}

function uriToID(URI) {
    var results = URI.match("spotify:track:(.*)");
    return results
}

function idtoURI(ID) {
    return "spotify:track:" + ID;
}

async function getSong(accessToken, id) {
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: 'https://api.spotify.com/v1/tracks/' + id,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken,
            }, success: function (data) {
                var output = {
                    name: data.name,
                    artist: data.artists[0].name
                }
                console.log(data)
                resolve(output)
            }, error: function (data) {
                console.log(data)
                reject(data)
            }
        })
    })

    return result;
}

function resumeSong(accessToken) {
    console.log(1);
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: "PUT",
            url: "https://api.spotify.com/v1/me/player/play",
            data: JSON.stringify({
            }), headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken,
            }, success: function (data) {
                console.log(data);
                console.log(data);
                resolve(data);
            }, error: function (data) {
                console.log(data);
                reject(error);
            }
        })
    })

    return result;
}
