
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

'use strict';
require('dotenv').config()

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
console.log("PAGE_ACCESS_TOKEN", PAGE_ACCESS_TOKEN)
// Imports dependencies and set up http server

const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const { VERIFY_TOKEN } = process.env
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});


function handleMessage(sender_psid, received_message) {
  let response;
    // Checks if the message contains text
    
  new Promise(function(resolve, reject) {
    if (!isNaN(received_message.text)) {    
      response = {
        "text": `Chúng tôi đang tìm thông tin doanh nghiệp có mã số thuế "${received_message.text}".\nVui lòng đợi trong giây lát...`
      }
      new Promise(() => {
        callSendAPI(sender_psid, response);  
      }).then(() => {
        callSendAPI(sender_psid, {"text": "..."});  
      })

      request({"uri": `${process.env.API_COMPANY_URL}/${received_message.text}`, "method": "GET",}, (err, res, body) => {
        console.log("body nè", body)
        var result = JSON.parse(`${body}`)
        if(result.MaSoThue)
        {
          response = {
            "text": `*Mã số thuế: ${result.MaSoThue}\n*Tên công ty: ${result.Title}\n*Người đại diện: ${result.ChuSoHuu}\n*Địa chỉ: ${result.DiaChiCongTy}\n\nĐể biết thêm ngành nghề của doanh nghiệp và các thông tin khác vui lòng truy cập \n${process.env.BASE_URL}doanh-nghiep${result.SolrID}`
          }
        }
        else
        {
          response = {
            "text": `Chúng tôi không tìm thấy doanh nghiệp có mã số thuế như bạn vừa nhập. Vui lòng kiểm tra và thử lại!`
          }
        }
        resolve()
        }
      )
    } else {
      response = {
        "text": `Mã số thuế bạn vừa nhập không hợp lệ! Vui lòng kiểm tra và thử lại! Lưu ý: mã số thuế phải là số.`
    }
      resolve()

    } 
   
  }).then(() => {
    // Send the response message
    callSendAPI(sender_psid, response);    
  });
    
    
    
  }

  function handlePostback(sender_psid, received_postback) {
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Thanks!" }
    } else if (payload === 'no') {
      response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}
