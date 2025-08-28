const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const ytSearch = require('yt-search');
const express = require('express'); // servidor web para uptime

// ------------------- EXPRESS (SERVIDOR WEB) -------------------
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('BotZap ONLINE ✅'));
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

// ------------------- CLIENTE WHATSAPP -------------------
const client = new Client({
    puppeteer: { headless: true }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📲 Escaneie o QR Code acima para conectar o BotZap');
});

client.on('ready', () => {
    console.log('✅ BotZap está ONLINE e pronto para uso!');
});

// ------------------- MENU -------------------
const menu = `🖥 LCC BOT V.1 • AUXILIAR 🤖

📌 O QUE DESEJA:  

1️⃣ INFORMAÇÕES 🎓  
2️⃣ AULAS NA SEMANA 🗓  
3️⃣ DOCUMENTOS 📑  
4️⃣ PERGUNTAS 🔎  
5️⃣ FOTOS DA TURMA 📷  
6️⃣ QUANTIDADE DE ALUNOS 👥  
7️⃣ QUER UMA MÚSICA? 💿

👉 *RESPONDA COM O NÚMERO DA OPÇÃO DESEJADA.*`;

// ------------------- INTERAÇÕES -------------------
client.on('message', async msg => {
    const body = msg.body ? msg.body.toLowerCase().trim() : '';
    const replyId = msg.id._serialized;

    // Mostrar menu
    if (body === '/menu' || body === '/lccbot' || (msg.mentionedIds && msg.mentionedIds.includes(client.info.wid._serialized))) {
        client.sendMessage(msg.from, menu, { quotedMessageId: replyId });
        return;
    }

    // Respostas do menu
    switch (msg.body.trim()) {
        case '1':
            client.sendMessage(msg.from, '🎓 INFORMAÇÕES: Aqui você encontra dados gerais sobre o curso e o bot.', { quotedMessageId: replyId });
            break;
        case '2':
            client.sendMessage(msg.from, 
`🗓 AULAS DA SEMANA - P1:

- Segunda: CÁLCULO 1 🧮
  Prof: Mario Souza

- Terça: ANTROPOLOGIA 👤
  Prof: Cleiton Barros

- Quarta: FUN. HISTÓRICOS ⌛
  Prof: Harley

- Quinta: PRÁTICA 1/ÉTICA E COMP. 📍
  Prof: Haroldo Amaral
  Prof(a): Ane

- Sexta: PROGRAMAÇÃO 🖥
  Prof: Leandroo

Deseja uma foto de horários gerais? Digite /sim`, { quotedMessageId: replyId });
            break;
        case '3':
            client.sendMessage(msg.from, '📑 DOCUMENTOS: Para solicitar documentos, envie "docs" seguido do nome.', { quotedMessageId: replyId });
            break;
        case '4':
            client.sendMessage(msg.from, '🔎 PERGUNTAS: Digite assim: /pergunta Qual a capital do Japão?', { quotedMessageId: replyId });
            break;
        case '5':
            sendFile(msg.from, 'logo.png', '📷 Foto da turma', replyId);
            break;
        case '6':
            client.sendMessage(msg.from, '👥 QUANTIDADE DE ALUNOS: Atualmente temos 32 alunos matriculados.', { quotedMessageId: replyId });
            break;
        case '7':
            client.sendMessage(msg.from, '💿 Para ouvir música, digite:\n`/musica [nome da música]`', { quotedMessageId: replyId });
            break;
    }

    // Comando música (yt-search)
    if (body.startsWith('/musica ')) {
        const query = msg.body.replace('/musica ', '').trim();
        if (!query) {
            client.sendMessage(msg.from, '❌ Digite o nome da música.\nExemplo: /musica Eminem Without Me', { quotedMessageId: replyId });
            return;
        }

        try {
            const results = await ytSearch(query);
            if (!results || !results.videos.length) {
                client.sendMessage(msg.from, '❌ Não encontrei nada no YouTube.', { quotedMessageId: replyId });
                return;
            }

            const video = results.videos[0];
            const reply = `🎵 Música encontrada:\n\n▶ ${video.url}\n\n📌 ${video.title} (${video.timestamp})`;
            client.sendMessage(msg.from, reply, { quotedMessageId: replyId });
        } catch (err) {
            console.error('❌ Erro na busca:', err);
            client.sendMessage(msg.from, '❌ Erro ao buscar no YouTube.', { quotedMessageId: replyId });
        }
    }

    // Responder ao /sim enviando a foto do horário
    if (body === '/sim') {
        sendFile(msg.from, 'horario.png', '🗓 Foto dos horários da semana', replyId);
    }

    // Comando pergunta
    if (body.startsWith('/pergunta')) {
        let pergunta = msg.body.replace('/pergunta','').trim();
        if(pergunta){
            client.sendMessage(msg.from, `🤖 Você perguntou: ${pergunta}\n(Aqui entra a resposta inteligente!)`, { quotedMessageId: replyId });
        }
    }
});

// ------------------- FUNÇÃO PARA ENVIAR ARQUIVOS -------------------
function sendFile(to, fileName, caption, replyId){
    const filePath = path.join(__dirname, 'arquivos', fileName);

    if(!fs.existsSync(filePath)){
        console.log(`❌ Arquivo não encontrado: ${filePath}`);
        client.sendMessage(to, `❌ O arquivo "${fileName}" não foi encontrado.`, { quotedMessageId: replyId });
        return;
    }

    try {
        const media = MessageMedia.fromFilePath(filePath);
        client.sendMessage(to, media, { caption, quotedMessageId: replyId });
    } catch(err) {
        console.error('❌ Erro ao enviar arquivo:', err);
        client.sendMessage(to, `❌ Não foi possível enviar o arquivo "${fileName}".`, { quotedMessageId: replyId });
    }
}

// ------------------- INICIALIZAÇÃO -------------------
client.initialize();