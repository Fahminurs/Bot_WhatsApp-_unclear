const {
    default: makeWASocket,
    DisconnectReason,
    useSingleFileAuthState
} = require("@adiwajshing/baileys");
const { Boom } = require("@hapi/boom");
const { state, saveState } = useSingleFileAuthState("./login.json");

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
            console.log("<===========> Koneksi tersambung! <===========>")
        }
    });
    sock.ev.on("creds.update", saveState);
//



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


                //Tampilkan nomer pengirim dan isi pesan
                console.log("Nomer Pengirim:", senderNumber);
                console.log("Isi Pesan:", incomingMessages);
                let text = 
                ' ✪✪✪ *ֆɨʟǟɦӄǟռ քɨʟɨɦ ʍɛռʊ :* ✪✪✪\n' +
                '\n*Menanyakan siapa kamu*\n' +
                '==> Masukkan "*_siapa kamu_*" \n' +
                '=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉\n' +
                '1. Sekarang Tanggal Berapa?\n' +
                '2. Ping!\n' +
                '3. Tentang Bot\n' +
                '=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉\n' +
                '*Untuk kembali dari pilihan*\n'+
                '==> Masukkan *_kembali_*\n' +
                '*Untuk keluar dari pilihan menu*\n'+
                '==> masukkan *_keluar_*';
              

            if (incomingMessages === 'menu') {
              
                await sock.sendMessage(senderNumber, { text: text }, { quoted: messages[0] });
            } else {
                switch (incomingMessages) {
                    case "1":
                        const today = new Date();
                        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                        const date = today.toLocaleDateString('id-ID', dateOptions);
                        const text = `Hari ini adalah ${date}.`;
                        await sock.sendMessage(senderNumber, { text: text });
                        break;
                    case "2":
                        let pingText = '';
                        for (let i = 0; i < 1000; i++) {
                            pingText += i + '. PONG!\n';
                        }
                        await sock.sendMessage(senderNumber, { text: pingText });
                        break;
                    case "3":
                        await sock.sendMessage(senderNumber, { text: "Ini adalah bot WhatsApp_ untuk project Kompetegram" });
                        break;
                    default:
                                       // Jika pesan yang masuk mengandung kata 'siapa' dan 'kamu'
                            if (incomingMessages.includes('siapa') && incomingMessages.includes('kamu')) {
                                // Kirim pesan balasan 'Saya Bot!'
                                await sock.sendMessage(
                                senderNumber,
                                { text: "Saya Bot!" },
                                { quoted: messages[0] },
                                2000
                                    
                                );      
                            }else if (incomingMessages.toLowerCase() === 'kembali') {
                                let text = 
                                ' ✪✪✪ *ֆɨʟǟɦӄǟռ քɨʟɨɦ ʍɛռʊ :* ✪✪✪\n' +
                                '\n*Menanyakan siapa kamu*\n' +
                                '==> Masukkan "*_siapa kamu_*" \n' +
                                '=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉\n' +
                                '1. Sekarang Tanggal Berapa?\n' +
                                '2. Ping!\n' +
                                '3. Tentang Bot\n' +
                                '=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉=҉\n' +
                                '*Untuk kembali dari pilihan*\n'+
                                '==> Masukkan *_kembali_*\n' +
                                '*Untuk keluar dari pilihan menu*\n'+
                                '==> masukkan *_keluar_*';
                              
                           
                            await sock.sendMessage(senderNumber, { text: text }, { quoted: messages[0] });
                        } else if (incomingMessages.toLowerCase() === 'keluar') {
                            // Kirim pesan untuk keluar dari menu
                            await sock.sendMessage(senderNumber, { text: 'Terima kasih telah menggunakan bot WhatsApp ini.' });
                        } else {
                            // Kirim pesan jika tidak ada pilihan yang cocok
                            await sock.sendMessage(senderNumber, { text: "Maaf, opsi yang Anda pilih tidak tersedia\nSilahkan masukkan *menu* untuk memilih menu" });
                        }
                        break;

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
