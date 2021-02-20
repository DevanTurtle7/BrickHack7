function spotifyLogin() {
    location.replace('https://accounts.spotify.com/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirect_uri + '&scope=user-read-currently-playing');
}

function login() {
    var responseQuery = window.location.search // Get the code in the URL returned from the Spotify login
    // The regex for getting the code
    var re = /[&?]code=([^&]*)/
    var code

    try {
        code = re.exec(responseQuery)[1] // Get the code
    } catch {
        // The window location is empty. Login to spotify
        spotifyLogin()
    }
}