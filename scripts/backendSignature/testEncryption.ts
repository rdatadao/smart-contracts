import { BigNumberish, Contract, JsonRpcProvider, Wallet, ethers, parseEther } from 'ethers';
import { rDataRewardAbi } from '../abi/RDataRewardAbi';
import { rDataAbi } from '../abi/RDataAbi';
import { log } from 'console';
import * as EthCrypto from 'eth-crypto';
import { create } from 'domain';

const provider = new JsonRpcProvider('https://rpc.ankr.com/eth_sepolia', 11155111);

const backendPrivateKey = '';
const backendAddress = '';
const backendPublicKey = '';


const aliceWalletPrivateKey = '';
const aliceWalletAddress = '';


async function signMessage(secretMessage: string) {
    // return  await window.ethereum.request({
    //     method: 'eth_sign',
    //     params: [EthCrypto.hash.keccak256(secretMessage)]
    //   });

    return EthCrypto.sign(
        aliceWalletPrivateKey,
        EthCrypto.hash.keccak256(secretMessage)
    )
}


async function encryptMessage(secretMessage: string) {
    const signature = await signMessage(secretMessage)

    const payload = {
        message: secretMessage,
        signature
    };

    const encrypted = await EthCrypto.encryptWithPublicKey(
        backendPublicKey,
        JSON.stringify(payload) // we have to stringify the payload before we can encrypt it
    );

    return EthCrypto.cipher.stringify(encrypted);
}

async function decryptMessage(encryptedString: string) {
    // we parse the string into the object again
    const encryptedObject = EthCrypto.cipher.parse(encryptedString);

    const decrypted = await EthCrypto.decryptWithPrivateKey(
        backendPrivateKey,
        encryptedObject
    );
    const decryptedPayload = JSON.parse(decrypted);

    // check signature
    const senderAddress = EthCrypto.recover(
        decryptedPayload.signature,
        EthCrypto.hash.keccak256(decryptedPayload.message)
    );

    const alicePublicKey = EthCrypto.recoverPublicKey(
        decryptedPayload.signature,
        EthCrypto.hash.keccak256(decryptedPayload.message)
    );

    console.log(`Got message from ${senderAddress} (publickKey = ${alicePublicKey}: ${decryptedPayload.message}`);

    const answerMessage = 'Backend response';
    return encryptBackendMessage(answerMessage, alicePublicKey)
}

async function encryptBackendMessage(message: string, publicKey: string) {
    const answerPayload = {
        message: message
    };

    const encryptedAnswer = await EthCrypto.encryptWithPublicKey(
        publicKey,
        JSON.stringify(answerPayload)
    );

    console.log('**********///////////////////');
    console.log(`0x${Buffer.from(JSON.stringify(encryptedAnswer), "utf8").toString("hex")}`);


    return EthCrypto.cipher.stringify(encryptedAnswer);
}

async function aliceDecrypt(encryptedString: string) {
    // return await window.ethereum.request({
    //     method: 'eth_decrypt',
    //     params: [EthCrypto.cipher.parse(encryptedString), aliceWalletAddress]
    // });


    console.log('********************************************');
    console.log(encryptedString);

    return await EthCrypto.decryptWithPrivateKey(
        aliceWalletPrivateKey,
        EthCrypto.cipher.parse(encryptedString)
    );
}

async function decryptBackendEncryptedString(encryptedString: string) {
    const decrypted = await aliceDecrypt(encryptedString)

    const decryptedPayload = JSON.parse(decrypted);

    console.log(`Alice decrypted this message: ${decryptedPayload.message}`);
}



async function main() {
    const aliceEncryptedString = await encryptMessage('Alice secret message');
    const backedResponse = await decryptMessage(aliceEncryptedString);
    console.log('backedResponse: ', backedResponse);
    await decryptBackendEncryptedString(backedResponse);
    // const backendDecryptedStringByAlice = await backendDecryptedStringByAlice(backedResponse);

    return;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });