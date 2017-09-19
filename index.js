require('dotenv').config({
    path: './development.env'
});
const cheerio = require('cheerio');
const request = require('request');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
var fs = require('fs');

var rule = new schedule.RecurrenceRule();

rule.hour = 15;
rule.minute = 54;

var j = schedule.scheduleJob(rule, function () {
    request.get('https://gre.economist.com/gre-vocabulary', function (err, response, body) {
        var $ = cheerio.load(body);
        var word = $('h1.wotd-word').text();
        var passage = $('div.wotd-passage').text();
        var definition = $('div.wotd-definition').text();
        var synonyms = $('div.wotd-synonyms').text();

        console.log(word, passage, definition, synonyms);

        var html = fs.readFileSync('./index.html', 'utf8');

        var _ = cheerio.load(html);

        _('h3').text(word);
        _('h3').append("<small><q>" + passage + "</q></small>");
        _('p.definition').append("<strong>Definition: </strong>" + definition);
        _('p.synonyms').text(synonyms);
        nodemailer.createTestAccount((err, account) => {

            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.USER_ID,
                    pass: process.env.PASSWORD
                }
            });

            let mailOptions = {
                from: process.env.SENDER_NAME + process.env.FROM, // sender address
                to: process.env.RECIPIENT_NAME + ' , ' + process.env.TO, // list of receivers
                subject: 'Word Of The Day ✔', // Subject line
                text: 'Hello world?', // plain text body
                html: _.html() // html body
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            });
        });
    })
});