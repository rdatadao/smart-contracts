import { BigNumberish, Contract, EventLog, JsonRpcProvider, Log, Wallet, ethers, formatEther, parseEther } from 'ethers';
import { rDataRewardAbi } from '../abi/RDataRewardAbi';
import fs from 'fs';
import { log } from 'console';

const rDataRewardAddress = '0x504f5456229676906c7406419169874f02329665';

const provider = new JsonRpcProvider('https://mainnet.base.org', 8453);

const rDataReward = new Contract(rDataRewardAddress, rDataRewardAbi, provider);


type ClaimedEvent = {
    userId: Number,
    receiveAddress: string,
    claimAmount: string,
    totalAmount: string,
}

const claimedEvents: ClaimedEvent[] = [];

// Function to parse event data and save to CSV
async function saveEventToCSV(event: any) {
    const claimEvent: ClaimedEvent = {
        userId: Number(event.args[0]),
        receiveAddress: event.args[1],
        claimAmount: formatEther(event.args[2]),
        totalAmount: formatEther(event.args[3]),
    }

    // log(event);
    // return;

    // claimedEvents.push(claimEvent);


    const csvData = `${event.blockNumber},${event.transactionHash},${claimEvent.userId},${claimEvent.receiveAddress},${claimEvent.claimAmount},${claimEvent.totalAmount}\n`;
    fs.appendFileSync('claimed_events.csv', csvData);
}

// Function to retrieve past events and listen to new events
async function listenToEvents(fromBlock: number, toBlock: number, querySize: number) {
    let totalEventsNumber = 0;


    while (fromBlock <= toBlock) {
        let events: any = await rDataReward.queryFilter('Claimed', fromBlock, fromBlock + querySize);
        totalEventsNumber += events.length;
        log(`Number of events from ${fromBlock} to ${fromBlock + querySize}: ${events.length}, totalEventsNumber: ${totalEventsNumber}`);

        fromBlock += querySize + 1;

        // Save past events to CSV
        for (const event of events) {
            saveEventToCSV(event);
        }
    }
}


// Define the block range
const minBlock = 12631992;
const maxBlock = 12876834;




async function main() {
    await listenToEvents(minBlock, maxBlock, 1000).catch(error => console.error('Error listening to events:', error));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });