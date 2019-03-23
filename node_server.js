const express = require('express')
const _docusign = require('./docusign_module.js')
const docusignDocs = require('./getSignedDocuments.js')
const app = express()
const port = 3000
var config = require('./config/configuration');
var rp = require('request-promise');
var PDFDocument = require('pdfkit');
var fs = require('fs');
var envelopeData = {}, _tempDocId, urls = { bos: null, fs: null};

app.set("view engine", "ejs");

app.get('/sign', (request, response) => {
    var f = request.query.f;
    var role = (request.query.r == "buyer") ? 0 : 1;
    if(role)
    var signerData, fileData;
    if(f == "bos") {
        _tempDocId = 1;
        fileData = {
                id: "1",
                path : "Bill of Sale.pdf",
                extension: 'pdf'
            };
        signerData = [{
                id : "1",
                clientUserId : '1001',
                recipientId: "1",
                routingOrder: "1",
                name: "Buyer",
                email: "shravz4@gmail.com",
                tabs: {
                    signHereTabs: [{
                        pageNumber: "1",
                        xPosition: "200",
                        yPosition: "580",
                        documentId: "1"
                    }],
                    dateSignedTabs: [{
                        pageNumber: "1",
                        xPosition: "500",
                        yPosition: "620",
                        documentId: "1"
                    }]
                }
            },
            {
                id : "2",
                clientUserId : '1002',
                recipientId: "2",
                routingOrder: "1",
                name: "Seller",
                email: "shravya.siluveru8@gmail.com",
                tabs: {
                    signHereTabs: [{
                        pageNumber: "1",
                        xPosition: "200",
                        yPosition: "500",
                        documentId: "1"
                    }],
                    dateSignedTabs: [{
                        pageNumber: "1",
                        xPosition: "500",
                        yPosition: "550",
                        documentId: "1"
                    }]
                }
            }]
    }
    if(role == 0){
        if(envelopeData[_tempDocId] != null) {
            return response.end("Seller's turn");
        }
        var d =_docusign.get_embedded_url(fileData, signerData, 0);
        d.then((data) => {
            envelopeData[_tempDocId] = data;
            return generateEmbeddedLink(data.accountId, data.envelopes, data.envelopeDefnition, 
                                        data.docusign_credentials, role);
        })
        .then((embeddedLink) => {
            response.redirect(embeddedLink.url);
        }).catch((err) => 
            console.log(err)
        );
    }
    else if(role == 1){
        if(envelopeData[_tempDocId] == null) {
            return response.end("Buyer's turn");
        }
        generateEmbeddedLink(envelopeData[_tempDocId].accountId, envelopeData[_tempDocId].envelopes, 
                                envelopeData[_tempDocId].envelopeDefnition, 
                                envelopeData[_tempDocId].docusign_credentials, role)
        .then((embeddedLink) => {
            urls.bos = embeddedLink.url;
            response.redirect(embeddedLink.url);
        }).catch((err) => 
            console.log(err)
        );
    }
});

app.get('/', (request, response) => {
    response.render("index");
});

app.get('/bos', (request, response) => {
    if(envelopeData['1'] == null)
        return response.send("Bill of Sale is not yet generated");
    docusignDocs.get_signed_document(envelopeData['1'].accountId,envelopeData['1'].envelopes.envelopeId, 
                                        envelopeData['1'].docusign_credentials)
    .then((file)=> {
        response.contentType("application/pdf");
        response.send(file);
    });
});



app.get('/buyer', (request, response) => {
    response.render("buyer");
});

app.get('/seller', (request, response) => {
    response.render("seller");
});

app.get('/success',(request, response) => {
    var eventResponse = request.query.event;
    if(eventResponse == 'signing_complete'){
        // if(flag == 1){
        //    return response.end("Both users signed");
        // }
        // flag = 1;
        // generateEmbeddedLink(envelopeData[_tempDocId].accountId, envelopeData[_tempDocId].envelopes, envelopeData[_tempDocId].envelopeDefnition, envelopeData[_tempDocId].docusign_credentials, 1)
        // .then((embeddedLink) => {
        //     response.redirect(embeddedLink.url);
        // }).catch((err) => 
        //     console.log(err)
        // );
        response.end("Signing complete");
    }
    else if(eventResponse == 'cancel')
        response.end("User decides to sign the document later");
    else if(eventResponse == 'exception')
        response.end("Error in processing the document");
    else if(eventResponse == 'fax_pending')
        response.end("User decides to fax the document later");
    else if(eventResponse == 'session_timeout')
        response.end("Session expired");
    else if(eventResponse == 'ttl_expired')
        response.end("Token used or expired.");
    else if(eventResponse == 'decline')
        response.end("User decides to decline signing the document");
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
});

var generateEmbeddedLink = function(accountId, envelopes, envelopeDefnition, docusign_credentials, i){
    
    //console.log (`Envelope was created! Envelope id: ${envelopes.envelopeId}`);
    var signer = envelopeDefnition.recipients.signers[i];

    var body = {
      "clientUserId": signer.clientUserId,
      "recipientId": signer.recipientId,
      "userName": signer.name,
      "email": signer.email,
      "returnUrl": config.oauth_redirect_URI,
      "authenticationMethod": config.authentication_method
    };

   var envelopeId = envelopes.envelopeId;
      return rp.post(`https://demo.docusign.net/restapi/v2/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`, {
          json: true,
          headers: {Authorization: 'Bearer '+docusign_credentials.token},
          body: body
      });
};