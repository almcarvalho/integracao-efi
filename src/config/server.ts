import cors from 'cors';
import express from 'express';
require('dotenv').config();
const axios = require('axios');

const PORT: string | number = process.env.PORT || 5001;

const app = express();

app.use(cors());

app.use(express.json());

//variável da máquina 01
var valorDoPix = 0;

//caso queira adicionar mais maquinas ...
var valordoPixMaquina2 = 0;


function converterPixRecebido(valorPix: number) {
    var valorAux = 0;
    var ticket = 1;
    if (valorPix > 0 && valorPix >= ticket) {
        valorAux = valorPix;
        valorPix = 0;
        //creditos
        var creditos = valorAux / ticket;
        creditos = Math.floor(creditos);
        var pulsos = creditos * ticket;
        var pulsosFormatados = ("0000" + pulsos).slice(-4);
        return pulsosFormatados;
    } else {
        return "0000";
    }
}


app.get("/consulta-Maquina01", async (req, res) => {
    var valorAux = 0;
    var ticket = 1;
    if (valorDoPix > 0 && valorDoPix >= ticket) {
        valorAux = valorDoPix;
        valorDoPix = 0;
        //creditos
        var creditos = valorAux / ticket;
        creditos = Math.floor(creditos);
        var pulsos = creditos * ticket;
        var pulsosFormatados = ("0000" + pulsos).slice(-4);


        return res.status(200).json({ "retorno": pulsosFormatados });
    } else {
        return res.status(200).json({ "retorno": "0000" });
    }
});


app.get("/consulta-maquina-02", async (req, res) => {
    var pulsosFormatados = converterPixRecebido(valordoPixMaquina2); //<<<<

    valordoPixMaquina2 = 0; //<<<<<

    if (pulsosFormatados != "0000") {
        return res.status(200).json({ "retorno": pulsosFormatados });
    } else {
        return res.status(200).json({ "retorno": "0000" });
    }
});



app.post("/rota-recebimento", async (req, res) => {
    try {
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log("ip");
        console.log(ip);
        var qy = req.query.hmac;
        console.log("query");
        console.log(qy);

        if (ip != '34.193.116.226') {
            return res.status(401).json({ "unauthorized": "unauthorized" });
        }


        if (qy != 'myhash1234' && qy != 'myhash1234/pix') {
            return res.status(401).json({ "unauthorized": "unauthorized" });
        }

        console.log("Novo chamada a essa rota detectada:");
        console.log(req.body);



        if (req.body.pix) {

            console.log("valor do pix recebido:");
            console.log(req.body.pix[0].valor);


            //arduino
            if (req.body.pix[0].txid == "70a8cdcb59b54eac0003") {
                valorDoPix = req.body.pix[0].valor;
                console.log("Creditando valor do pix na máquina 1");
            }

            // if (req.body.pix[0].txid == "txidNumeroDaMaquina02") {
            //     //valordoPixMaquina2 = req.body.pix[0].valor;
            //     //console.log("Creditando valor do pix na máquina 2");
            // }

            //discord - notificações
            if (req.body.pix[0].txid == "70a8cdcb59b54eac0003") {
                var urlDoWebhookNoDiscord = "https://discord.com/api/webhooks/1202796385293045780/5HTCCrI3TB-Zc6wkv94fe9OXjxr51Dkh6uLhN2_UGj2zxQ5OA35S6o77fFF_zwae71_t";

                var loja = "";

                if (req.body.pix[0].txid == "70a8cdcb59b54eac0003") {
                    loja = "Frente de Caixa 01";
                }

                notificar(urlDoWebhookNoDiscord, loja, req.body.pix[0].valor);
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(402).json({ "error": "error: " + error });
    }
    return res.status(200).json({ "ok": "ok" });
});


app.post("/rota-recebimento-teste", async (req, res) => {
    try {
        console.log("Novo pix detectado:");
        console.log(req.body);

        // console.log("valor:");
        // console.log(req.body.valor);
        // console.log("txid:");
        // console.log(req.body.txid);

        var txid = req.body.txid;

        valorDoPix = req.body.valor;
        console.log("setado valor pix para maquina 2:" + req.body.valor);

        console.log(req.body.valor);
    } catch (error) {
        console.error(error);
        return res.status(402).json({ "error": "error: " + error });
    }
    return res.status(200).json({ "mensagem": "ok" });
});


app.get('/brcode', (req, res) => {
    const { nome, cidade, chave, valor, txid } = req.query;

    // Verifica se todos os parâmetros necessários foram fornecidos
    if (!nome || !cidade || !chave || !valor || !txid) {
        return res.status(400).send('Parâmetros incompletos');
    }

    // Formata os dados para o formato BRCode
    const brCode = `00020126580014br.gov.bcb.pix0136${chave}52047372530398654042.005802BR5914${nome}6007${cidade}62240520${txid}6304`;

    const calculado = calcularCRC16(brCode);

    const retorno = `${brCode}${calculado}`;

    res.send({ "brcode": retorno });
});

app.post('/testar-funcao-crc16', (req, res) => {
    res.send(calcularCRC16(req.body.nome));
});

//validação de crc para gerar o brCode do qrcode

function calcularCRC16(str: string, invert: boolean = false): string {
    const bytes = new TextEncoder().encode(str);

    const crcTable = [0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823, 0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70, 0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067, 0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d, 0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a, 0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0];

    let crc = 0xFFFF;

    for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        const j = (c ^ (crc >> 8)) & 0xFF;

        crc = crcTable[j] ^ (crc << 8);
    }

    let answer = ((crc ^ 0) & 0xFFFF);

    let hex = numToHex(answer, 4);

    if (invert)
        return hex.slice(2) + hex.slice(0, 2);

    return hex;
}

function numToHex(n: number, digits?: number): string {
    const hex = n.toString(16).toUpperCase();

    if (digits) {
        return ("0".repeat(digits) + hex).slice(-digits);
    }

    return (hex.length % 2 == 0) ? hex : "0" + hex;
}

async function notificar(urlDiscordWebhook: string, txid: string, valor: string) {
    //An array of Discord Embeds.
    let embeds = [
        {
            title: "Novo Pix Recebido",
            color: 5174599,
            footer: {
                text: `📅 ${new Date()}`,
            },
            fields: [
                {
                    name: "Txid" + txid,
                    value: "Valor: " + valor
                },
            ],
        },
    ];

    //Stringify the embeds using JSON.stringify()
    let data = JSON.stringify({ embeds });

    //Create a config object for axios, you can also use axios.post("url", data) instead
    var config = {
        method: "POST",
        url: urlDiscordWebhook,
        headers: { "Content-Type": "application/json" },
        data: data,
    };

    //Send the request
    axios(config)
        .then((response: any) => {
            console.log("Notificação enviada com sucesso!");
            return response;
        })
        .catch((error: any) => {
            console.log("erro ao tentar enviar notificação!");
            console.log(error);
            return error;
        });
}



//código escrito por Lucas Carvalho em meados de Fevereiro de 2024

//git add .
//git commit -m "mensagem"
//git push

app.listen(PORT, () => console.log(`localhost:${PORT}`)); 