const chai = require('chai'),
      expect = chai.expect,
      should = chai.should(),
      rewire = require("rewire"),
      _docusign = rewire('../docusign_module'),
      _ = require('lodash');

    describe ('Authentication Token', function(){

        it('Token not empty', function() {
            _docusign.__get__('requestAuthenticationToken')().then(function(result) {
                result.access_token.should.not.be.empty;
            })
        });

        it('Token expires in 3600', function() {
            _docusign.__get__('requestAuthenticationToken')().then(function(result) {
                result.expires_in.should.equal(3600);
            })
        });
      
    })

    describe ('Get Accounts', function(){

        it('Accounts should not be empty', function() {
            var tokenData, credentials;

            _docusign.__get__('requestAuthenticationToken')()
            .then(function(result) {
                 tokenData = result;
                 credentials = _docusign.__get__('setDocumentCredentials')(tokenData);
                 _docusign.__get__('getAccounts')(credentials).then(function(result) {
                       result.should.not.be.empty;
                       result.accounts.should.not.be.empty;
                 })
            });
            
        });

    })

    describe ('Create Envelope', function(){

        it('Envelope should be created with id and status as sent', function() {
            
            var tokenData, credentials;

            _docusign.__get__('requestAuthenticationToken')()
            .then(function(tokenResult) {
                 tokenData = tokenResult;
                 credentials = _docusign.__get__('setDocumentCredentials')(tokenData);

                 _docusign.__get__('getAccounts')(credentials).then(function(accountsResult) {
                    let account_info = _.find(accountsResult.accounts, 
                        (account) => account.is_default);
                    let accountId = account_info.account_id;
                    let envelopeDefnition = getEnvelopeDefnition(); 
                    _docusign.__get__('createEnvelopeFromDocuments')
                             (accountId, credentials, envelopeDefnition )
                             .then(function(envelopeData){
                                    envelopeData.envelopeId.should.not.be.empty;
                                    envelopeData.status.should.be.equal('sent');
                             });
                 })
            });
            
        });

    })

    describe ('Generate Envelope Link', function(){

        it('Link should not be empty', function() {
            
            var tokenData, credentials;

            _docusign.__get__('requestAuthenticationToken')()
            .then(function(tokenResult) {
                 tokenData = tokenResult;
                 credentials = _docusign.__get__('setDocumentCredentials')(tokenData);

                 _docusign.__get__('getAccounts')(credentials).then(function(accountsResult) {
                    let account_info = _.find(accountsResult.accounts, 
                        (account) => account.is_default);
                    let accountId = account_info.account_id;
                    let envelopeDefnition = getEnvelopeDefnition(); 
                    _docusign.__get__('createEnvelopeFromDocuments')
                             (accountId, credentials, envelopeDefnition )
                             .then(function(envelopes){
                                _docusign.__get__('generateEmbeddedLink')
                                         (accountId, envelopes, envelopeDefnition, credentials)
                                         .then(function(result){
                                             result.url.should.not.be.empty;
                                         })
                             });
                 })
            });
            
        });

    })

    function getEnvelopeDefnition(){
        var signerData = {
            id : "1",
            clientUserId : '1001',
            recipientId: "1",
            name: "shravz",
            email: "shravz4@gmail.com"
        };
        var fileData = {
            id: "1",
            path : "Registration.pdf",
            extension: 'pdf',
            signHere: {
                pageNumber: "1",
                xPosition: "200",
                yPosition: "580"
            },
            dateSigned: {
                pageNumber: "1",
                xPosition: "500",
                yPosition: "620"
            }
        };

        return _docusign.__get__('getEnvelopeDefnition')(fileData, signerData);
    }