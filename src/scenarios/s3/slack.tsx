import { SlackWindow, type SlackConfig } from "../tools/slack"

// Scenario 3’s Slack: the Litterbox Labs workspace on Thursday morning. While Keller was away, Christine asked in
// #marketing and Kelly in a DM. Keller's Duet answered from Keller's confirmed decisions where one
// covered the question (Christine's DM yesterday), and passed the rest to Keller. Kelly's question
// touches Trevor's brand decision, so the Duet brought Trevor in. Tuesday's clash over the end card was
// settled in Keller's DM with Trevor, and the Duet's DM opens on what happened while Keller was away.
const S3_SLACK: SlackConfig = {
  workspace: "Litterbox Labs",
  person: "MC",
  project: "whiskr",
  open: "app",
  convos: [
    {
      id: "marketing", kind: "channel", name: "marketing", part: "Marketing", ask: "du10",
      msgs: [
        { id: "m1", who: "MC", day: "Yesterday", when: "10:31", text: "The promo video is out of Runway. It’s 15 seconds, and Luna is the star." },
        { id: "m2", who: "CH", day: "Yesterday", when: "16:30", text: "Let’s launch Mon Nov 2, the week of the pet expo.", caught: "launch" },
        { id: "m3", who: "CH", day: "Today", when: "8:30", text: "@Keller How many more days does the video need? I might push the launch back a little.", nosave: true },
        { id: "m4", who: "MC", duet: true, day: "Today", when: "8:30", text: "No decision of Keller’s covers this yet, so I passed it to Keller." },
      ],
    },
    {
      id: "brand", kind: "channel", name: "brand", part: "Brand",
      msgs: [
        { id: "b1", who: "app", day: "Monday", when: "9:12", text: "New decision in Brand", cards: ["dart"] },
        { id: "b2", who: "TR", day: "Yesterday", when: "17:05", text: "Posters should use the exact same blue as the app.", save: "Use the app’s exact blue on the posters" },
      ],
    },
    {
      id: "general", kind: "channel", name: "general",
      msgs: [
        { id: "g1", who: "KL", day: "Yesterday", when: "12:10", text: "The cat test photos are in the shared drive." },
        { id: "g2", who: "CH", day: "Today", when: "8:05", text: "Standup is at 10 today." },
      ],
    },
    {
      id: "kelly", kind: "dm", name: "Kelly", people: ["KL"], ask: "du11",
      msgs: [
        { id: "k1", who: "KL", day: "Yesterday", when: "17:40", text: "What’s the exact hex of the blue in the promo video? I want the app prototype to match.", nosave: true },
        { id: "k2", who: "MC", duet: true, day: "Yesterday", when: "17:40", text: "No decision of Keller’s covers this, and it touches Trevor’s brand decision, so I brought Keller and Trevor in.", link: "kelly-trevor" },
      ],
    },
    {
      id: "kelly-trevor", kind: "dm", name: "Kelly, Trevor", people: ["KL", "TR"], together: "a-du11",
      msgs: [
        { id: "x1", who: "MC", duet: true, day: "Yesterday", when: "17:40", text: "Kelly asked for the exact hex of the blue in the promo video, to match the app prototype. No decision of Keller’s covers it, and it touches Trevor’s decision.", cards: ["rw-blue", "nored"] },
      ],
    },
    {
      id: "christine", kind: "dm", name: "Christine", people: ["CH"],
      msgs: [
        { id: "c1", who: "CH", day: "Yesterday", when: "14:20", text: "Is the promo video blue now, or still red like the posters?", nosave: true },
        { id: "c2", who: "MC", duet: true, day: "Yesterday", when: "14:20", text: "It’s blue, following Trevor’s decision.", cards: ["bluecard"] },
      ],
    },
    {
      id: "trevor", kind: "dm", name: "Trevor", people: ["TR"],
      msgs: [
        { id: "t1", who: "MC", duet: true, day: "Tuesday", when: "15:10", text: "Keller’s decision clashes with Trevor’s, so I brought you both in.", cards: [{ mark: "triangle", title: "Make the end card red, like the old logo", who: "Keller · Marketing", why: "People know the red logo from the posters." }, "nored"] },
        { id: "t2", who: "TR", day: "Tuesday", when: "15:14", text: "Cats see red as gray, so a red end card would disappear for them. Blue works for owners too.", nosave: true },
        { id: "t3", who: "MC", day: "Tuesday", when: "15:20", text: "Fair. Blue it is.", nosave: true },
        { id: "t4", who: "app", day: "Tuesday", when: "15:20", text: "Saved with both your names.", cards: ["endblue"] },
      ],
    },
    {
      id: "app", kind: "app", name: "Whyspace",
      msgs: [
        { id: "w1", who: "app", day: "Today", when: "9:00", text: "Morning, Keller. Here’s what happened while you were away.", caughtList: true },
      ],
    },
  ],
}

export function S3Slack() {
  return <SlackWindow config={S3_SLACK} />
}
