'use strict'

// Loading configuration
const dotenv = require('dotenv').config({
    path: 'config.env'
})

// Carregar base de dados
const escolas = require('./db/escolas.json')

// Busca Fuzzy
const Fuse = require('fuse.js')
const fuse_options = {
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        "escola"
    ]
}
const fuse = new Fuse(escolas, fuse_options)

// Botly - Gerencia as chamadas ao Facebook
const Botly = require('botly')
const botly = new Botly({
    accessToken: process.env.FB_PAGE_ACCESS_TOKEN,
    verifyToken: process.env.FB_VERIFY_TOKEN
})

// Express - Gerencia a troca de dados do bot
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

// Nodemon - Para reinicio automático da aplicação em execução quando houver alguma modificação no arquivo
const nodemon = require('nodemon')

let users = {}

botly.on("message", (sender, message, data) => {
    // let text = `echo: ${data.text}`;

    if (users[sender]) {
        console.log("MESSAGE: " + users[sender].action)

        switch (users[sender].action) {
            case 'AVALIAR_REFEICAO':
                users[sender].action = 'DEFAULT'
                botly.sendText({ id: sender, text: "Legal, vou repassar a mensagem pro pessoal daqui! :D" })
                break;

            case 'VERIFICAR_ALIMENTOS':
                let text = fuse.search(data.text)

                if (!text[0]) {
                    botly.sendText({id: sender, text: 'Eu não achei essa escola!! Vamos tentar de novo?' + '\n\nDigita aí o nome da escola, ' +
                                                      'que eu vou procurar informações no meu banco de dados! :)'})
                } else {
                    botly.sendText(echo_message(sender, text[0].escola))
                    alimentos_dia(sender)
                }
                break;

            default:
                botly.sendText({id: sender, text: ";)"})
                break;


        }
    } else {
        botly.getUserProfile(sender, (err, info) => {
            users[sender] = info

            // Salvar info do usuário no nosso ~banco de dados~
            // let file = './db/users/' + sender + '.json'
            //jf.writeFileSync(file, info)

            botly.sendText(welcome_message(sender, users[sender].first_name))
        })
    }
});

botly.on("postback", (sender, message, postback) => {
    switch (postback) {
        case 'MENU_ALUNO':
            users[sender].action = "VERIFICAR_ALIMENTOS"
            botly.sendText({
                id: sender,
                text: 'Aluno! Entendi! Bom, para poder te dar informações sobre o cardápio escolar, ' +
                'preciso que você me diga em que escola você está estudando. \n\nDigita aí o nome da escola, ' +
                'que eu vou procurar informações no meu banco de dados! :)'

            })
            break;

        case 'MENU_RESPONSAVEL':
            users[sender].action = "VERIFICAR_ALIMENTOS"
            botly.sendText({
                id: sender,
                text: 'Responsável! Entendi! Imaginamos que você esteja preocupado com a alimentação do aluno, ' +
                'e por aqui iremos te ajudar a entender mais sobre o que a escola tem servido. ' +
                '\n\nFaz o seguinte: me fala qual a escola que o aluno estuda, que eu vou procurar mais sobre a refeição servida! :)'

            })
            break;

        case 'AVALIAR_REFEICAO':
            users[sender].action = "AVALIAR_REFEICAO"
            botly.sendText({
                id: sender,
                text: 'Você tem alguma mensagem pra deixar sobre a refeição que foi servida? Diz aí pra mim, que eu vou repassar a mensagem pra meus amigos da Prefeitura!'

            })
            break;

        case 'GET_STARTED_CLICKED':
            botly.getUserProfile(sender, (err, info) => {
                users[sender] = info

                // Salvar info do usuário no nosso ~banco de dados~
                // let file = './db/users/' + sender + '.json'
                //jf.writeFileSync(file, info)

                botly.sendText(welcome_message(sender, users[sender].first_name))
            })
            break;

        case 'INFO_NUTRICIONAL':
            botly.sendText({
                id: sender,
                text: 'Informação nutricional de 🍚 Arroz (135g): ' +
                    '\n🔴 Calorias - 176kcal' +
                    '\n🔴 Gorduras - 0,4g' +
                    '\n🔴 Carboidratos - 38g' +
                    '\n🔴 Proteínas - 3,6g'

            })
            break;

        default:
            break;

    }
})

let welcome_message = (sender, name) => {
    return {
        id: sender,
        text: 'Olá, ' + name + '! Sou a Tia Rô, o bot da Secretaria Municipal de ' +
        'Educação que traz informações sobre alimentação escolar para pais e alunos. ' +
        'Antes de começarmos, me diga: você é um pai, ou um aluno?',
        quick_replies: [
            botly.createQuickReply('Sou responsável! 👩', 'MENU_RESPONSAVEL'),
            botly.createQuickReply('Sou aluno! 😊', 'MENU_ALUNO')

        ]
    }
}

let echo_message = (sender, text) => {
    return {
        id: sender,
        text: 'Você deseja informações sobre a escola ' + text + ', certo? Bom, hoje essa refeição foi servida...'
    }
}

let alimentos_dia = (sender, text) => {
    let element = [{
        title: "Arroz",
        image_url: "https://perdendobarriga.com.br/wp-content/uploads/2016/04/arroz_branco.png",
        subtitle: "Arroz branco, cozido",
        buttons: [{
            type: "postback",
            title: "Info Nutricional",
            payload: "INFO_NUTRICIONAL"
        }]
    },
    {
        title: "Feijão",
        image_url: "http://g.glbimg.com/og/gs/gsat5/f/thumbs/tag/2015/07/14/feijao-620_1.jpg",
        subtitle: "Feijão, cozido",
        buttons: [{
            type: "postback",
            title: "Info Nutricional",
            payload: "INFO_NUTRICIONAL"
        }]
    },
    {
        title: "Frango",
        image_url: "https://t1.rg.ltmcdn.com/pt/images/8/1/4/img_frango_cozido_simples_4418_600.jpg",
        subtitle: "Frango, cozido",
        buttons: [{
            type: "postback",
            title: "Info Nutricional",
            payload: "INFO_NUTRICIONAL"
        }]
    },
    {
        title: "Avaliar Refeição",
        image_url: "http://knavishhedgehogs.com/wp-content/uploads/2015/07/five-stars1.png",
        subtitle: "Deixe uma avaliação pra refeição!",
        buttons: [{
            type: "postback",
            title: "Avaliar",
            payload: "AVALIAR_REFEICAO"
        }]
    }
    ]

    botly.sendGeneric({ id: sender, elements: element, aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL }, (err, data) => {
        console.log("send generic cb:", err, data);
    });
}

botly.setGetStarted({ pageId: process.env.FB_PAGE_ID, payload: "GET_STARTED_CLICKED" }, (err, body) => {
    if (err) {
        console.log('Get Started: ERR: ' + JSON.stringify(err, null, 2))
    } else {
        console.log('Get Started: BODY: ' + JSON.stringify(body, null, 2))
    }
});

botly.setGreetingText({
    pageId: process.env.FB_PAGE_ID,
    greeting: [{
        "locale": "default",
        "text": "Olá! Por aqui você pode ter informações sobre a alimentação escolar da Prefeitura de São Paulo! 😊"
    }]
}, (err, body) => {
    if (err) {
        console.log('Greeting Text Started: ERR: ' + JSON.stringify(err, null, 2))
    } else {
        console.log('Greeting Text Started: BODY: ' + JSON.stringify(body, null, 2))
    }
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use("/webhook", botly.router())
app.set('port', process.env.PORT || 3000)

app.listen(app.get('port'), () => {
    console.log('Bot running on port', app.get('port'))
});
