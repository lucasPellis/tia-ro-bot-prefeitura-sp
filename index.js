'use strict'

// Loading configuration
const dotenv = require('dotenv').config({
    path: 'config.env'
})

// Carregar base de dados
const escolas = require('./db/escolas')

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
        "nome"
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
    let text = fuse.search(data.text)

    if (users[sender]) {
        botly.sendText(echo_message(sender, text))

    } else {
        botly.getUserProfile(sender, (err, info) => {
            users[sender] = info
            botly.sendText(welcome_message(sender, users[sender].first_name))
        })
    }
});

botly.on("postback", (sender, message, postback) => {
    switch (postback) {
        case 'MENU_ALUNO':
            botly.sendText({
                id: sender,
                text: 'Aluno! Entendi! Bom, para poder te dar informações sobre o cardápio escolar, ' +
                    'preciso que você me diga em que escola você está estudando. Digita aí o nome da escola, ' +
                    'que eu vou procurar informações no meu banco de dados! :)'
                 
                }, (err, data) => {
                    let text = fuse.search(data.text)
                    botly.sendText({id: sender, text: 'Sua escola é a: ' + text + '!'})
                }
            )
            break;

        case 'MENU_RESPONSAVEL':
            botly.sendText({
                id: sender,
                text: 'Responsável! Entendi! Imaginamos que você esteja preocupado com a alimentação do aluno, ' +
                    'e por aqui iremos te ajudar a entender mais sobre o que a escola tem servido. ' +
                    'Faz o seguinte: me fala qual a escola que o aluno estuda, que eu vou procurar mais sobre a refeição servida! :)'
                 
                }, (err, data) => {
                    let text = fuse.search(data.text)
                    botly.sendText({id: sender, text: 'Sua escola é a: ' + text + '!'})
                }
            )
            break;

        case 'REALIZAR_AVALIACAO':
            botly.sendText({

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
            botly.createQuickReply('Sou responsável! 🐶', 'MENU_RESPONSAVEL'),
            botly.createQuickReply('Sou aluno! 😊', 'MENU_ALUNO')

        ]
    }
}

let echo_message = (sender, text) => {
    return {
        id: sender,
        text: 'Você disse: ' + text
    }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use("/webhook", botly.router());
app.listen(9999);