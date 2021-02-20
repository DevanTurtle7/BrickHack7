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
    getToken(clientSecret, code);

    if (localStorage.getItem("refreshToken") == null) {
        var clientSecret = await getClientSecret(database);
        var data = await initializeTokens(clientSecret, code);

        localStorage.setItem("refreshToken", data.refresh_token);
    }
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