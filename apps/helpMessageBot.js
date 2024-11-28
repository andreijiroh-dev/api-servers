function helpMessage() {
  const templateJson = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "slack.go.andreijiroh.xyz - @ajhalili2006's golinks service in Slack",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "I am the bot that <https://andreijiroh.xyz|@ajhalili2006> uses to manage his golinks in Slack, although you can use me as a link shortener and to request custom golinks for approval.",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Need to shorten a link, add a Discord or wikilink? Submit a request and you'll be notified via DMs if it's added.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Request a link",
            emoji: true,
          },
          value: "request-link",
          action_id: "golinks-bot-action",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Want to use me programmatically? You can request a API token using your GitHub account through the OAuth prompt.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Sign in to get token",
            emoji: true,
          },
          value: "tbd",
          action_id: "github-auth-challenge",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Want to see the API docs and experiment with it? You can take a sneak peek.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open API docs",
            emoji: true,
          },
          url: `https://go.andreijiroh.xyz/api/docs`,
        },
      },
      {
        type: "context",
        elements: [
          {
            text: "If something go wrong, <https://go.andreijiroh.xyz/feedback/slackbot|please file a new issue> or ping @ajhalili2006 on the fediverse (or here in the Slack if he's here).",
            type: "mrkdwn",
          },
        ],
      },
    ],
  };
  return JSON.stringify(templateJson);
}

console.log(helpMessage())
