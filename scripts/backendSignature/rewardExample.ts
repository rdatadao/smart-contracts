import { BigNumberish, Contract, JsonRpcProvider, Wallet, ethers, parseEther } from 'ethers';
import { rDataRewardAbi } from './RDataRewardAbi';
import { rDataAbi } from './RDataAbi';
import { log } from 'console';

const rDataAddress = '0x2bDE71a995616AEf0E4aF854A12b89a5E26e63D7';
const rDataRewardAddress = '0xD703b22ce502B39bF75ABbcEA621643b0Cf66bc0';

const provider = new JsonRpcProvider('https://rpc.ankr.com/eth_sepolia', 11155111);


async function backendSignMethod(
    userId: number,
    receiveAddress: string,
    amount: BigInt,
    deadline: BigInt,
): Promise<string> {
    const backendWalletPrivateKey = '859116fd61a2882324e1b6d918358969484df02cbbdc5d2c767c71b51fe3ca95';
    const backendWalletAddress = '0xeF553bE22c9D5365A8D4C38DF43970212e9D3e0A';

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
            address: '0x98081F830481183C140aDACE5b5Db2D060c0BdF3',
            rewardAmount: BigInt(parseEther('1500'))
        },
        {
            address: '0xa51896cba143566a49296d4ef62721bEF2f4F342',
            rewardAmount: BigInt(parseEther('500'))
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

    // const wallets: WalletInfo[] = [
    //     {
    //         address: '0x98081F830481183C140aDACE5b5Db2D060c0BdF3',
    //         privateKey: '859116fd61a2882324e1b6d918358969484df02cbbdc5d2c767c71b51fe3ca74'
    //     },
    //     {
    //         address: '0xa51896cba143566a49296d4ef62721bEF2f4F342',
    //         privateKey: '859116fd61a2882324e1b6d918358969484df02cbbdc5d2c767c71b51fe3ca81'
    //     }
    // ];

    // const userWallet = new Wallet(wallets[claimParams.userId].privateKey, provider);


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
                               //https://sepolia.etherscan.io/address/0xD703b22ce502B39bF75ABbcEA621643b0Cf66bc0#writeProxyContract#F1
}






async function main() {
    const claimParams = await getUserClaimParams(0); //call backend api to get the user's claim params

    await callClaimMethod(claimParams)  //call claim method from the Reward smart contract


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });