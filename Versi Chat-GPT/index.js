// Menampahkan Dependencies
const {
    default: makeWASocket,
    DisconnectReason,
    useSingleFileAuthState
} = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom");
const { state, saveState } = useSingleFileAuthState("./login.json");

//Bagian Koding ChatGPT
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: 'API CHAT GPT',
});
const openai = new OpenAIApi(configuration);

//Fungsi OpenAI ChatGPT untuk Mendapatkan Respon
async function generateResponse(text) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: "\"\"\"\nUtil exposes the following:\nutil.openai() -> authenticates & returns the openai module, which has the following functions:\nopenai.Completion.create(\n    prompt=\"<my prompt>\", # The prompt to start completing from\n    max_tokens=123, # The max number of tokens to generate\n    temperature=1.0 # A measure of randomness\n    echo=True, # Whether to return the prompt in addition to the generated completion\n)\n\"\"\"\nimport util\n\"\"\"\nCreate an OpenAI completion starting from the prompt \"Once upon an AI\", no more than 5 tokens. Does not include the prompt.\n\"\"\"\n",
        temperature: 0,
        max_tokens: 64,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop: ["\"\"\""],
    });
    return response.data.choices[0].text;
}


async function connectToWhatsApp() {

    //Buat sebuah koneksi baru ke WhatsApp
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQuertTimeoutMs: undefined
    });

    //Fungsi untuk Mantau Koneksi Update
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Koneksi terputus karena ", lastDisconnect.error, ", hubugkan kembali!", shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        }
        else if (connection === "open") {
            console.log("Koneksi tersambung!")
        }
    });
    sock.ev.on("creds.update", saveState);

    //Fungsi Untuk Mantau Pesan Masuk
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        console.log("Tipe Pesan: ", type);
        console.log(messages);
        if (type === "notify" && !messages[0].key.fromMe) {
            try {

                //Dapatkan nomer pengirim dan isi pesan
                const senderNumber = messages[0].key.remoteJid;
                let incomingMessages = messages[0].message.conversation;
                if (incomingMessages === "") {
                    incomingMessages = messages[0].message.extendedTextMessage.text;
                }
                incomingMessages = incomingMessages.toLowerCase();

                //Dapatkan Info Pesan dari Grup atau Bukan 
                //Dan Pesan Menyebut bot atau Tidak
                const isMessageFromGroup = senderNumber.includes("@g.us");
                const isMessageMentionBot = incomingMessages.includes("@6282126083338");

                //Tampilkan nomer pengirim dan isi pesan
                console.log("Nomer Pengirim:", senderNumber);
                console.log("Isi Pesan:", incomingMessages);

                //Tampilkan Status Pesan dari Grup atau Bukan
                //Tampilkan Status Pesan Mengebut Bot atau Tidak
                console.log("Apakah Pesan dari Grup? ", isMessageFromGroup);
                console.log("Apakah Pesan Menyebut Bot? ", isMessageMentionBot);

                //Kalo misalkan nanya langsung ke Bot / JAPRI
                if (!isMessageFromGroup) {

                    //Jika ada yang mengirim pesan mengandung kata 'siapa'
                    if (incomingMessages.includes('siapa') && incomingMessages.includes('kamu')) {
                        await sock.sendMessage(
                            senderNumber,
                            { text: "Saya Bot!" },
                            { quoted: messages[0] },
                            2000
                        );
                    } else {
                        async function main() {
                            const result = await generateResponse(incomingMessages);
                            console.log(result);
                            await sock.sendMessage(
                                senderNumber,
                                { text: result + "\n\n" },
                                { quoted: messages[0] },
                                2000
                            );
                        }
                        main();
                    }
                }

                //Kalo misalkan nanya via Group
                if (isMessageFromGroup && isMessageMentionBot) {
                    //Jika ada yang mengirim pesan mengandung kata 'siapa'
                    if (incomingMessages.includes('siapa') && incomingMessages.includes('kamu')) {
                        await sock.sendMessage(
                            senderNumber,
                            { text: "Saya Bot!" },
                            { quoted: messages[0] },
                            2000
                        );
                    } else {
                        async function main() {
                            const result = await generateResponse(incomingMessages);
                            console.log(result);
                            await sock.sendMessage(
                                senderNumber,
                                { text: result + "\n\n" },
                                { quoted: messages[0] },
                                2000
                            );
                        }
                        main();
                    }
                }



            } catch (error) {
                console.log(error);
            }
        }
    });

}

connectToWhatsApp().catch((err) => {
    console.log("Ada Error: " + err);
});