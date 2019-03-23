
Important Links:

1. Sender Authentication using JWT
   https://developers.docusign.com/esign-rest-api/guides/authentication/oauth2-jsonwebtoken

2. Create Envelope and Url for Envelope to embed inside application
   https://developers.docusign.com/esign-rest-api/code-examples/signing-from-your-app

3. Envelope Reciepients - JSON Input Format:
   https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeRecipients/update/#examples

4. Event Response:
   https://developers.docusign.com/esign-rest-api/guides/features/embedding

            cancel - the recipient decides to finish later
            decline - the recipient declines signing
            exception - a processing error occurs during the signing session
            fax_pending - if the recipient choses to print, sign and fax back
            id_check_failed - if authentication was added to the document, this is when the recipient fails
            session_timeout - the signing session times out when recipient goes idle
            signing_complete - the recipient completed signing
            ttl_expired - the token was not used within the timeout period or the token was already accessed
            viewing_complete - a recipient that does not need to sign completes the viewing ceremony 

5. Recipient Authentication Methods
    https://developers.docusign.com/esign-rest-api/reference/Envelopes/EnvelopeViews/createRecipient/
            
            Biometric
            Email
            HTTPBasicAuth
            Kerberos
            KnowledgeBasedAuth
            None
            PaperDocuments
            Password
            RSASecureID
            SingleSignOn_CASiteminder
            SingleSignOn_InfoCard
            SingleSignOn_MicrosoftActiveDirectory
            SingleSignOn_Other
            SingleSignOn_Passport
            SingleSignOn_SAML
            Smartcard
            SSLMutualAuth
            X509Certificate