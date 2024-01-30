import cors from 'cors';
import express from 'express';
require('dotenv').config();
const dated = require('date-and-time')


const PORT: string | number = process.env.PORT || 5001;

const app = express();

app.use(cors());

app.use(express.json());



var valorDoPix = 0;

var valordoPixMaquina2 = 0; //txid flaksdfjaskldfj


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

//flaksdfjaskldfj << ALTERAR PARA O TXID DA MAQUINA
app.get("/consulta-rafael-mac02-lojaFulanoDeTal", async (req, res) => {
    var pulsosFormatados = converterPixRecebido(valordoPixMaquina2); //<<<<<<ALTERAR PARA O NUMERO DA MAQUINA

    valordoPixMaquina2 = 0; //<<<<<<<<<ALTERAR PARA O NUMERO DA MAQUINA

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


            if (req.body.pix[0].txid == "70dcb59b94eac9ccbm01") {
                valorDoPix = req.body.pix[0].valor;
                console.log("Creditando valor do pix na máquina 2");
            }

            if (req.body.pix[0].txid == "flaksdfjaskldfj") {
                //valordoPixMaquina3 = req.body.pix[0].valor;
                //console.log("Creditando valor do pix na máquina 3");
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



//código escrito por Lucas Carvalho em meados de Junho de 2023...
//git push heroku main
app.listen(PORT, () => console.log(`localhost:${PORT}`)); 