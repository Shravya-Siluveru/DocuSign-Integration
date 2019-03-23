#!/usr/bin/env node
var config = require('./config/configuration');
var Promise = require('promise');
var rp = require('request-promise'),
    _ = require('lodash'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    moment = require('moment');

module.exports.get_embedded_url = function(fileData, signerData){

    return new Promise(function(resolve, reject){
        var docusign_credentials, envelopeDefnition, accountId, link;
    
        requestAuthenticationToken()
        .then((tokenData) => {
            docusign_credentials = setDocumentCredentials(tokenData);
        })
        .then(() => { 
            envelopeDefnition = getEnvelopeDefnition(fileData, signerData) 
        })
        .then(() => 
            getAccounts(docusign_credentials)
        )
        .then((accounts) => {
            let account_info = _.find(accounts.accounts, (account) => account.is_default);
            accountId = account_info.account_id;
        })
        .then(() =>
            createEnvelopeFromDocuments(accountId, docusign_credentials, envelopeDefnition )
        )
        .then((envelopes) => {
            resolve( {accountId, envelopes, envelopeDefnition, docusign_credentials} );
        })
        .catch((err) => 
            console.log(err)
        )
        });
    }

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

var getEnvelopeDefnition = function(fileData, signerData){
    // create an envelope that will store the document(s), field(s), and recipient(s)
    var envDef = {}, signer = {}, signer2 = {} ;
    envDef.emailSubject = 'Please sign this document sent from Node SDK';

    // create a byte array that will hold our document bytes
    var fileBytes = null;
    try {
        var fs = require('fs');
        var path = require('path');
        // read file from a local directory
        fileBytes = fs.readFileSync(path.resolve(__dirname, `${config.documents_folder}`+fileData.path));
        // fileBytes = fs.readFileSync(path.resolve(__dirname, "[PATH/TO/DOCUMENT]"));
    } catch (ex) {
        // handle error
        console.log('Exception: File not found');
    }

    /* CUSTOMIZE SIGNATURE. Follow below link
        https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeRecipients/update/#examples
    */
    // add a document to the envelope
    var doc = {};
    var base64Doc = new Buffer(fileBytes).toString('base64');
    doc.documentBase64 = base64Doc;
    doc.name = fileData.path;
    doc.extension = fileData.extension;
    doc.documentId = fileData.id;

    var docs = [];
    var tabs = {};
    var tabs1 = {};
    var signHere = {};
    var dateSigned = {};
    var fullName = {};
    var signHereTabs = [];
    var dateSignedTabs = [];
    var fullNameTabs = [];

    docs.push(doc);
    envDef.documents = docs;

    // add a recipient to sign the document, identified by name and email we used above
    signer.id = signerData[0].id;
    signer.name = signerData[0].name;
    signer.email = signerData[0].email;
    signer.recipientId = signerData[0].recipientId;
    signer.clientUserId = signerData[0].clientUserId;
    signer.routingOrder = signerData[0].routingOrder;

    signer2.id = signerData[1].id;
    signer2.name = signerData[1].name;
    signer2.email = signerData[1].email;
    signer2.recipientId = signerData[1].recipientId;
    signer2.clientUserId = signerData[1].clientUserId;
    signer2.routingOrder = signerData[1].routingOrder;

    // create a signHere tab x pixels down and y right from the top left

    if(signerData[0].tabs){
        // signHere.documentId = fileData.id;
        // signHere.pageNumber = fileData.signHere.pageNumber;
        // //signHere.recipientId = signerData[i].recipientId;
        // signHere.xPosition = fileData.signHere.xPosition;
        // signHere.yPosition = fileData.signHere.yPosition;
        //signHereTabs.push(signerData[0].tabs.signHere);
        tabs = signerData[0].tabs;
    }
    if(signerData[1].tabs){
        // signHere.documentId = fileData.id;
        // signHere.pageNumber = fileData.signHere.pageNumber;
        // //signHere.recipientId = signerData[i].recipientId;
        // signHere.xPosition = fileData.signHere.xPosition;
        // signHere.yPosition = fileData.signHere.yPosition;
        //signHereTabs.push(signerData[1].tabs.signHere);
        tabs1 = signerData[1].tabs;
    }

    // if(signerData[0].tabs.dateSigned){
    //     // dateSigned.documentId = fileData.id;
    //     // dateSigned.pageNumber = fileData.dateSigned.pageNumber;
    //     // //dateSigned.recipientId = signerData[i].recipientId;
    //     // dateSigned.xPosition = fileData.dateSigned.xPosition;
    //     // dateSigned.yPosition = fileData.dateSigned.yPosition;
    //     // dateSigned.bold = true;
    //     dateSignedTabs.push(signerData[0].tabs.dateSigned);
    //     tabs.dateSignedTabs = dateSignedTabs;
    // }
    // if(signerData[1].tabs.dateSigned){
    //     // dateSigned.documentId = fileData.id;
    //     // dateSigned.pageNumber = fileData.dateSigned.pageNumber;
    //     // //dateSigned.recipientId = signerData[i].recipientId;
    //     // dateSigned.xPosition = fileData.dateSigned.xPosition;
    //     // dateSigned.yPosition = fileData.dateSigned.yPosition;
    //     // dateSigned.bold = true;
    //     dateSignedTabs.push(signerData[1].tabs.dateSigned);
    //     tabs1.dateSignedTabs = dateSignedTabs;
    // }
    // if(signerData[0].tabs.fullName){
    //     // fullName.documentId = fileData.id;
    //     // fullName.pageNumber = fileData.fullName.pageNumber;
    //     // //fullName.recipientId = signerData[i].recipientId;
    //     // fullName.xPosition = fileData.fullName.xPosition;
    //     // fullName.yPosition = fileData.fullName.yPosition;
    //     // fullName.fontSize = "8";
    //     fullNameTabs.push(signerData[0].tabs.fullName);
    //     tabs.fullNameTabs = fullNameTabs;
    // }
    // if(signerData[1].tabs.fullName){
    //     // fullName.documentId = fileData.id;
    //     // fullName.pageNumber = fileData.fullName.pageNumber;
    //     // //fullName.recipientId = signerData[i].recipientId;
    //     // fullName.xPosition = fileData.fullName.xPosition;
    //     // fullName.yPosition = fileData.fullName.yPosition;
    //     // fullName.fontSize = "8";
    //     fullNameTabs.push(signerData[1].tabs.fullName);
    //     tabs1.fullNameTabs = fullNameTabs;
    // }
    
    signer.tabs = tabs;
    signer2.tabs = tabs1;
    
    // add recipients (in this case a single signer) to the envelope
    envDef.recipients = {};
    envDef.recipients.signers = [];
    envDef.recipients.signers.push(signer);
    envDef.recipients.signers.push(signer2);
    
    // send the envelope by setting |status| to "sent". To save as a draft set to "created"
    envDef.status = 'sent';
    return envDef;
};

var createEnvelopeFromDocuments = function(accountId, docusign_credentials, envelopeDefnition){
    return rp.post(`https://demo.docusign.net/restapi/v2/accounts/${accountId}/envelopes`, {
        json: true,
        headers: { Authorization: 'Bearer '+docusign_credentials.token },
        body: envelopeDefnition
    });
};


