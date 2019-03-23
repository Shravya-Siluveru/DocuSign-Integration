#!/usr/bin/env node
var config = require('./config/configuration');
var Promise = require('promise');
var rp = require('request-promise'),
    _ = require('lodash'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    moment = require('moment');

    module.exports.get_signed_document = function(accountID, envelopeID, Docusign_credentials){
    return new Promise(function(resolve, reject) {
        var docusign_credentials, envelopeDefnition, accountId, link;
        requestAuthenticationToken()
        .then((tokenData) => {
            docusign_credentials = setDocumentCredentials(tokenData);
        })
        .then(() => 
            getAccounts(docusign_credentials)
        )
        .then((accounts) => {
            let account_info = _.find(accounts.accounts, (account) => account.is_default);
            accountId = account_info.account_id;
        })
        .then(() =>
            getDocumentsList(accountId, docusign_credentials, envelopeID )
        )
        .then((envelopeData) => {
            var documentId = envelopeData.envelopeDocuments[0].documentId;
            return getDocument(accountId, envelopeID, documentId, docusign_credentials);
        })
        .then((file) => {
            
            resolve(file);
        })
        .catch((err) => 
            console.log(err)
        )
    });
}

getDocumentsList = function(accountID, docusign_credentials, envelopeID ) {
    return rp.get(`https://demo.docusign.net/restapi/v2/accounts/${accountID}/envelopes/${envelopeID}/documents`,{
        json: true,
        headers: { Authorization: 'Bearer '+docusign_credentials.token },
        followAllRedirects: true
    })
    .catch(function(err){
        console.log(err);
    });
};

getDocument = function(accountID,envelopeID,documentID, docusign_credentials) {
    return rp.get(`https://demo.docusign.net/restapi/v2/accounts/${accountID}/envelopes/${envelopeID}/documents/${documentID}`,{
        headers: { Authorization: 'Bearer '+docusign_credentials.token },
        encoding: null
    });
};

requestAuthenticationToken = function(){
    // create the JWT payload to get the user's token
    let payload = {
        "iss": config.client_id,
        "sub": config.impersonated_user_guid,
        "iat": new Date().getTime() / 1000,
        "exp": new Date().getTime() / 1000 + 3600,
        "aud": config.aud,
        "scope": config.permission_scopes,
    };
    let private_key = fs.readFileSync(config.private_key_file);
    let jwt_token = jwt.sign(payload, private_key, {algorithm: 'RS256'});

    return rp.post(`${config.authentication_url}/oauth/token`, {
        json: true,
        form: {
            'grant_type': config.jwt_grant,
            'assertion': jwt_token
        },
        followAllRedirects: true
})
};

var setDocumentCredentials = function(tokenData){
    var credentials = {
                        token: tokenData.access_token,
                        expires: new Date().getTime() + (tokenData.expires_in * 1000)
                    };
    let m = moment(credentials.expires);      
    //console.log(`The token will expire ${m.fromNow()}. (${m.format()})`);
    return credentials;
};

var getAccounts = function(docusign_credentials){
    // Call userinfo to get the user's account_id and api_base_url
    // See https://docs.docusign.com/esign/guide/authentication/userinfo.html
    // If the user or account is fixed for this app then you can
    // treat the api_base_url as a constant. It is set per account and changes
    // extremely infrequently (less often than once a year)
    return rp.get(`${config.authentication_url}/oauth/userinfo`, {
        json: true,
        headers: { Authorization: 'Bearer '+docusign_credentials.token },
        followAllRedirects: true
    });
};
