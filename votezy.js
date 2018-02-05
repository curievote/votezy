////////////////////////////////////////////////////////////////////////////////
//-----  VOTEZY STEEMIT.COM Bot v0.0.2 - An Open NodeJS Source "Pay-4-Vote" Script
//-----  A functional yet probably not wise to run paid voting script in nodeJS
//----- Written, Tested (barely), Butchered and Released by: @KLYE steemit.com/@klye
//----- Like this Script and want More?! Please vote my witness efforts!
////////////////////////////////////////////////////////////////////////////////

const steem = require('steem');

const version = '0.0.2';
const authors = ['klye', 'reggaemuffin'];

// Add your Account Info Here!
const votebot = "klye"; // Account to Run Bot on
const wif = ""; // Posting Private Key Here

// NO NEED TO MODIFY THESE

const metadata = {
    "app": `votezy/${version}`
};
let opscan = 1;

// Lets Start this script!
console.log(`Starting Votezy v${version} on @${votebot} Account - Script By @${authors.join(', @')}`);

// Transfer operation found? Lets see if it is for us!
var process_transfer = function (op) {
  console.log(op);
    const depositer = op.data.from;
    const currency = op.data.amount.lastIndexOf(" ") + 1;
    const depositmemo = op.data.memo;
    const amount = parseFloat(currency[0]);
    const type = currency[1];
    // Look for Steemit.com Link
    if (depositmemo.toLowerCase().indexOf("https://steemit.com") >= 0) {
        if (amount >= 0.001) {
            console.log(`${currency.join(' ')} transfer from @${depositer()} to @${votebot} Detected with Memo Containing Link:"`);
            console.log(depositmemo);
            const parentAuthor = depositmemo.match(/\/@(\w*)\//)[1];
            console.log("Parent Author: " + parentAuthor);
            const permlink = depositmemo.substring(depositmemo.lastIndexOf("/") + 1);
            console.log("Permalink: " + permlink);
            const weight = Math.floor(Math.random() * 10000);
            const weightpercent = parseFloat(weight / 100).toFixed(2);
            // Prepare vote response
            const balancetable = [
                "| <center><h4>@" + parentAuthor + " Got a <b>" + weightpercent + "%</b> Vote via @" + votebot + "</h4></center> |",
                "|:----:|",
                "| <center>Send any amount of STEEM or SBD Over 1.000 & Recieve a RANDOM @" + votebot + " VOTE<br>Make sure to include the link to your post in the memo field of the transfer!<br><sub>( Any amounts < 1.000 STEEM or SBD will be considered donations )</sub></center> |",
                "| <center>Vote power is Generated via RNG (Random Number Generator)</center> |"
            ].join("\n");
            const title = `@${votebot} Pay-4-Vote Report:`;
            //reply comment
            steem.broadcast.vote(
                wif,
                votebot,
                parentAuthor,
                permlink,
                weight,
                function (err, result) {
                    // if it f**ks up...
                    if (err) {
                        console.log("Pay-4-Vote FAILED");
                        console.log(err);
                        return;
                    }
                    ;
                    // If it wins
                    if (result) {
                        console.log("Pay-4-Vote Success! Upvote of " + weightpercent + "%!");
                        replycomment(wif, parentAuthor, permlink, votebot, permlink, title, balancetable, metadata);
                    }
                    ;
                });
        }
    }

}

// Send a voted comment
function replycomment(parentAuthor, permlink, votebot, title, content, metadata) {
    //broadcast comment
    steem.broadcast.comment(wif, parentAuthor, permlink, votebot, permlink, title, content, metadata, function (commentfailz, commentwinz) {
        if (commentfailz) {
            console.log("Error");
            // Load first op without removing
            steem.broadcast.comment(wif, parentAuthor, permlink, votebot, permlink, title, content, metadata, function (errqc, winqc) {
                if (errqc) {
                    console.log("ERROR Sending Comment!");
                }
                if (winqc) {
                    console.log(parentAuthor + "'s Response Sent");
                }
            });
        }
        ; //END  if (commentfailz)
        if (commentwinz) {
            console.log(parentAuthor + "'s Response Sent");

        }
    });

}


const log = require('fancy-log');
const moment = require('moment');


//steem.api.setOptions({url: 'https://rpc.buildteam.io'});

steem.api.setOptions({
    url: 'https://api.steemit.com'
});


let shutdown = false;
let blockNum = process.argv[2] || 19439706;

async function start() {
    try {
        log(`Parser is resuming at block ${blockNum}`);
        parseBlock(blockNum);
    } catch (e) {
        log(`bailing with ${e}`);
        return bail(e);
    }
}

async function bail(err) {
    log(`bailing on ${err}`);
    log.error(err);
    process.exit(err === undefined ? 0 : 1);
}

function parseBlock(blockNum) {
    steem.api.getBlock(blockNum, async function (err, block) {
        try {
            if (err !== null) return bail(err);
            if (block === null) {
                log(`At end of chain, waiting for new block…`);
                await timeout(30000);
                return setTimeout(() => parseBlock(blockNum));
            }
            blockJSON = JSON.stringify(block);
            timestamp = moment.utc(block.timestamp);
            var blockfull = (( parseInt(getBinarySize(blockJSON)) / 65536 ) * 100).toFixed(2);
            log(`Block #${blockNum} at ${block.timestamp}, ${timestamp.fromNow()}, ${moment().diff(timestamp, 'seconds')} seconds by @${block.witness} - ${block.transactions.length} TXs - ${getBinarySize(blockJSON)}/65536 kb (${blockfull}% Full)`);
            blockNum++;
            for (let transaction of block.transactions) {
                for (let operation of transaction.operations) {
                    const action = operation[0];
                    const data = operation[1];
                    const op = {
                        action: action,
                        data: data
                    };
                    // log(`Found operation ${JSON.stringify(op)}`);
                    if (action === "transfer" && data.to === votebot) {
                        opscan++;
                        console.log("Transfer Scanned: " + opscan);
                        process_transfer(op);
                    }
                }
            }
            if (shutdown) return bail();
            setTimeout(() => parseBlock(blockNum));
        } catch (e) {
            log(`bailing with ${e}`);
            return bail(e);
        }
    });
}

process.on('SIGINT', function () {
    log(`Shutting down in 10 seconds, start again with block ${blockNum}`);
    shutdown = true;
    setTimeout(bail, 10000);
});

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getBinarySize(string) {
    return Buffer.byteLength(string, 'utf8');
}

return start();
