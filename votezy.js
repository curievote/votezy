////////////////////////////////////////////////////////////////////////////////
//-----  VOTEZY STEEMIT.COM Bot v0.0.1 - An Open NodeJS Source "Pay-4-Vote" Script
//-----  A functional yet probably not wise to run paid voting script in nodeJS
//----- Written, Tested (barely), Butchered and Released by: @KLYE steemit.com/@klye
//----- Like this Script and want More?! Please vote my witness efforts!
////////////////////////////////////////////////////////////////////////////////
// Add your Account Info Here!
var votebot = "klye"; // Account to Run Bot on
var wif = ""; // Posting Private Key Here

// NO NEED TO MODIFY THESE
var steem = require('steem');
var metadata = {
    "app": "votezy/0.0.1"
};
var opscan = 0;
var errorconn = 0;

// Lets Start this script!
console.log("Starting Votezy v0.0.1 on @" + votebot + " - Script By @KLYE");
// Fix to send to new API server
steem.api.setOptions({ url: 'https://api.steemit.com'});
steem.config.set('websocket', 'wss://steemd.steemitdev.com');
//steem.api.setOptions({ url: 'https://steemd.privex.io' });
// Start the script scanning
trannyscanner();

// The Transaction Streamer function
function trannyscanner() {

    // Stream irreversible Operations
    steem.api.streamOperations('irreversible', function(err2, safeblockops) {
        // If operations call to RPC f*cks up
        if (err2) {
            errorconn++;
            if (errorconn % 3 === 0) {
                console.log("ERROR - RPC Connection Lost/Timeout");
                console.log("Attempting to Reconnect to Official Steemit.com RPC now..!");
                steem.api.setOptions({
                    url: 'https://api.steemit.com'
                });
                steem.config.set('websocket', 'wss://steemd.steemitdev.com');
                trannyscanner();
                return;
            } else {
                console.log("ERROR - RPC Connection Lost/Timeout");
                console.log("Attempting to Reconnect to rpc.buildteam.io RPC now..!");
                steem.api.setOptions({
                    url: 'https://rpc.buildteam.io'
                });
                steem.config.set('websocket', 'wss://gtg.steem.house:8090');
                trannyscanner();
                return;
            };
        };
        // If we get operations from server
        if (safeblockops) {
            // get 1st item in blockops an apply to operationType variable to check type later
            var opType = safeblockops[0];
            // get 2nd item in blockops and store it later to be parsed if it's our specified type of operation
            var op = safeblockops[1];
            //check if current operation is a comment
            if (opType == "transfer") {
                opscan++;
                console.log("Transfer Scanned: " + opscan);
                process_transfer(op);
            }
        };
    }); // END streamOperations irreversible!!!
}; // End trannyscanner

// Transfer operation found? Lets see if it is for us!
var process_transfer = function(op) {
    if (op["to"] == votebot) {

        var depositer = op["from"];
        var reciever = op["to"];
        var firstdepo = op["amount"];
        var currency = op["amount"];
        var depositmemo = op["memo"];
        var chaching = parseFloat(currency);
        var type = currency.substring(currency.lastIndexOf(" ") + 1);
        // Unused "if no memo" logic
        if (depositmemo == undefined) {
            //console.log(time + " - " + chaching + " " + type + " Transfer from @" + depositer + " to @" + reciever);
        } else {
            // Look for Steemit.com Link
            if (depositmemo.toLowerCase().indexOf("https://steemit.com") >= 0) {
                if (chaching >= 0.001) {
                    console.log(chaching + " " + type + " transfer from @" + depositer + " to @" + reciever + " Detected with Memo Containing Link:");
                    console.log(depositmemo);
                    var parentAuthor = depositmemo.match(/\/@(\w*)\//)[1];
                    console.log("Parent Author: " + parentAuthor);
                    var permlink = depositmemo.substring(depositmemo.lastIndexOf("/") + 1);
                    console.log("Permalink: " + permlink);
                    var weight = Math.floor(Math.random() * 10000);
                    var weightpercent = parseFloat(weight / 100).toFixed(2);
                    // Prepare vote response
                    var balancetable = [
                        "| <center><h4>@" + parentAuthor + " Got a <b>" + weightpercent + "%</b> Vote via @" + votebot + "</h4></center> |",
                        "|:----:|",
                        "| <center>Send any amount of STEEM or SBD Over 1.000 & Recieve a RANDOM @KLYE VOTE<br>Make sure to include the link to your post in the memo field of the transfer!<br><sub>( Any amounts < 1.000 STEEM or SBD will be considered donations )</sub></center> |",
                        "| <center>Vote power is Generated via RNG (Random Number Generator)</center> |"
                    ].join("\n");
                    var title = "@KLYE Pay-4-Vote Report:";
                    //reply comment
                    steem.broadcast.vote(
                        wif,
                        votebot,
                        parentAuthor,
                        permlink,
                        weight,
                        function(err, result) {
                            // if it f**ks up...
                            if (err) {
                                console.log("Pay-4-Vote FAILED");
                                console.log(err);
                                return;
                            };
                            // If it wins
                            if (result) {
                                console.log("Pay-4-Vote Success! Upvote of " + weightpercent + "%!");
                                replycomment(wif, parentAuthor, permlink, votebot, permlink, title, balancetable, metadata);
                            };
                        });
                }
            };
        }
    };
};

// Send a voted comment
var replycomment = function(wif, parentAuthor, permlink, votebot, permlink, title, content, metadata) {
    //broadcast comment
    steem.broadcast.comment(wif, parentAuthor, permlink, votebot, permlink, title, content, metadata, function(commentfailz, commentwinz) {
        if (commentfailz) {
            console.log("Error");
            // Load first op without removing
            steem.broadcast.comment(wif, parentAuthor, permlink, votebot, permlink, title, content, metadata, function(errqc, winqc) {
                if (errqc) {
                    console.log("ERROR Sending Comment!");
                }
                if (winqc) {
                    console.log(parentAuthor + "'s Response Sent");
                }
            });
        }; //END  if (commentfailz)
        if (commentwinz) {
            console.log(parentAuthor + "'s Response Sent");

        }
    });

}; //END replycomment
