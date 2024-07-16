import { BigNumberish, Contract, JsonRpcProvider, Wallet, ethers, parseEther } from 'ethers';
import { rDataRewardAbi } from '../abi/RDataRewardAbi';
import { rDataAbi } from '../abi/RDataAbi';
import { log } from 'console';

const rDataAddress = '';
const rDataRewardAddress = '';

const provider = new JsonRpcProvider('https://rpc.ankr.com/eth_sepolia', 11155111);


async function backendSignMethod(
    userId: number,
    receiveAddress: string,
    amount: BigInt,
    deadline: BigInt,
): Promise<string> {
    const backendWalletPrivateKey = '';
    const backendWalletAddress = '';

    const backendWallet = new Wallet(backendWalletPrivateKey, provider);
    
    const hash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [userId, receiveAddress, amount, deadline]
    );

    return backendWallet.signMessage(ethers.getBytes(hash));
}


type ClaimParams = {
    userId: number,
    userAddress: string,
    rewardAmount: BigInt,
    deadline: BigInt,
    signature: string
}
async function getUserClaimParams(userId: number): Promise<ClaimParams> {
    type User = {
        address: string;
        rewardAmount: BigInt;
    }

    const users: User[] = [
        {
            address: '',
            rewardAmount: BigInt(parseEther('100'))
        },
        {
            address: '',
            rewardAmount: BigInt(parseEther('100'))
        }
    ]

    const user: User = users[userId];

    return {
        userId: userId,
        userAddress: user.address,
        rewardAmount: user.rewardAmount,
        deadline: BigInt(1771576240),
        signature: await backendSignMethod(userId, user.address, user.rewardAmount, BigInt(1771576240))
    }
}


async function callClaimMethod(claimParams: ClaimParams) {
    type WalletInfo = {
        address: string;
        privateKey: string;
    }


    const rDataReward = new Contract(rDataRewardAddress, rDataRewardAbi, provider);

    const rData = new Contract(rDataAddress, rDataAbi, provider);

    log(claimParams);

    await rDataReward.claim(
        claimParams.userId,
        claimParams.userAddress,
        claimParams.rewardAmount,
        claimParams.deadline,
        claimParams.signature,
    );                         //this doesn't work into the script, but will work on frontend. 
                               //this will opo-up the wallet provider (metamask) and ask user to sing and send the transaction
                               //you can try sending the transaction using the claim method: 
}






async function main() {
    const backendWalletPrivateKey = '';
    const backendWalletAddress = '';

    const backendWallet = new Wallet(backendWalletPrivateKey, provider);

    log(backendWallet.signingKey)

    return;

    const claimParams = await getUserClaimParams(1); //call backend api to get the user's claim params

    await callClaimMethod(claimParams)  //call claim method from the Reward smart contract


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });