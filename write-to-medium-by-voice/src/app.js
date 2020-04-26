'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const rp = require('request-promise');

const punctuationArray = [".", "!", "?"]
const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    async LAUNCH() {
        this.ask('#findyourvoice ! Welcome to write by voice. This is best used on a device with a screen so you can see what I hear. Time to write. Speak 1 sentence at a time. Say publish when you are ready to publish. What is your first sentence?', 'What is your first sentence?');
    },

    WriteByVoiceIntent() {
        const userInput = this.$inputs.sentence.value;
        const userSentence = userInput.charAt(0).toUpperCase() + userInput.slice(1) + (punctuationArray.includes(userInput.charAt(userInput.length - 1)) ? "" : ".");
        console.log("USER INPUT");
        console.log(userSentence);
        if (userSentence === "Publish.") {
            return this.toIntent("PublishIntent");
        }
        this.$session.$data.article = this.$session.$data.article ? this.$session.$data.article + " " + userSentence : userSentence;
        console.log("FULL ARTICLE");
        console.log(this.$session.$data.article);
        this.ask('Excellent, here\'s your article so far: ' + this.$session.$data.article + ' what\'s the next sentence?');
    },

    async PublishIntent() {
        const jovoThis = this;
        var options = {
            method: 'POST',
            uri: 'https://us-central1-write-by-voice-2020-sweets.cloudfunctions.net/sendEmail',
            body: {
                email: this.$session.$data.article
            },
            json: true // Automatically stringifies the body to JSON
        };
         
        await rp(options)
            .then(function (parsedBody) {
                // POST succeeded...
            })
            .catch(function (err) {
                // POST failed...
            });
        return this.tell("Success! Your story was published. Here's what you wrote: " + this.$session.$data.article + " Check your email for the next step. Thanks for writing by voice!")
    },

    UNHANDLED() {
        this.tell('Hey ' + this.$inputs.name.value + ', nice to meet you!');
    },
});

module.exports.app = app;
