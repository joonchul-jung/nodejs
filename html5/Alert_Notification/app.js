var schedule = require('node-schedule');
var hana = require('@sap/hana-client');
var conn = hana.createConnection();
var request = require('request');

var conn_params = {
    serverNode  : "a1ec9ca0-3dc6-4693-86fb-62d39fc31c9e.hana.trial-eu10.hanacloud.ondemand.com:443", // Change here.
    encrypt     : true,
    schema      : "_SYS_STATISTICS",
    uid         : "DBADMIN",
    pwd     : "Jjc!76007785" // Change here.
  };

var job = schedule.scheduleJob({
  second:  10 // Run as every minites.
}, function (fireTime) {

  conn.connect(conn_params, function(err) {
    if (err) {
      console.log("DB Error: DB Connection --- ", err);
      var msg = [{msg: "DB Error: DB Connection"}];
      res.json({searchResult: msg});
      return;
    }

    var sql = 'SELECT ALERT_ID,INDEX,ALERT_NAME,ALERT_RATING,ALERT_TIMESTAMP FROM "_SYS_STATISTICS"."STATISTICS_CURRENT_ALERTS" WHERE ALERT_RATING > 2;';
	// Run SQL Query
	conn.exec(sql, function(err, result) {
      if (err) {
        console.log("DB Error: SQL Execution --- ", err);
      }

      conn.disconnect();
      console.log(result);

      if (result.length == 0){
        // do nothing
      }
      else{
        // send mail
		var options = {
		  url: 'https://clm-sl-ans-live-ans-service-api.cfapps.eu10.hana.ondemand.com/cf/producer/v1/resource-events', // Endpoint URL + "/cf/producer/v1/resource-events"
		  method: 'POST',
		  auth: {
		    user: "43a3fa89-7a52-48b3-a3a7-73596de15796", // Change here.
		    password: "wUz+b3lGepCB30+8RYg4q03FeMVMzylR"  // Change here.
		  },
		  json: {
				  "eventType": "mycustomevent",
				  "resource": {
				    "resourceName": "Your Node.js App.",
				    "resourceType": "app",
				    "tags": {
				      "env": "HANA Service develop environment"
				    }
				  },
				  "severity": "FATAL",
				  "category": "ALERT",
				  "subject": "HANA Service Alert occured",
				  "body": result.length+" alerts occuring!!\n" + JSON.stringify(result)
			}
		}

		// Send Alert request.
		request(options, function (error, response, body) {
			//console.log(response.body);

			console.log('Send E-mail Notification.');
		});

      }
    });
  });
});
