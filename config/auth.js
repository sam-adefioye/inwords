// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    // 'facebookAuth' : {
    //     'clientID'      : 'your-secret-clientID-here', // your App ID
    //     'clientSecret'  : 'your-client-secret-here', // your App Secret
    //     'callbackURL'   : 'http://localhost:8080/auth/facebook/callback',
    //     'profileURL'    : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
    //     'profileFields' : ['id', 'email', 'name'] // For requesting permissions from Facebook API
    // },
    //
    // 'twitterAuth' : {
    //     'consumerKey'       : 'your-consumer-key-here',
    //     'consumerSecret'    : 'your-client-secret-here',
    //     'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    // },

    'googleAuth' : {
        'clientID'      : '1054044114460-2i5bnek2e8b50105atkbatf9f1f8q7gk.apps.googleusercontent.com',
        'clientSecret'  : '6U-8ZGswy8zJtxes-UAEP54q',
        'callbackURL'   : 'http://localhost:5000/auth/google/callback'
    }

};
