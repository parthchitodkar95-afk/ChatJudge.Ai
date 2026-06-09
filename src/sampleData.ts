import { ChatJudgeReport } from "./types";

export const SAMPLE_CHAT_TEXT = `12/01/25, 10:00 AM - Rahul: bhai tune aaj bhi late kiya
12/01/25, 10:02 AM - Priya: sorry yaar traffic tha
12/01/25, 10:03 AM - Rahul: hamesha excuse hi deti ho
12/01/25, 10:05 AM - Priya: main koshish karti hoon, tum samajhte nahi
12/01/25, 10:06 AM - Rahul: main hi galat hoon hamesha, haina?
12/01/25, 10:08 AM - Priya: nahi aisa nahi hai, chill karo
12/01/25, 10:09 AM - Rahul: mujhe mat bolo chill karo
12/01/25, 10:11 AM - Priya: okay baba sorry, khush?
12/01/25, 10:12 AM - Rahul: fine
12/01/25, 10:30 AM - Priya: aaj lunch saath karein?
12/01/25, 10:45 AM - Rahul: dekhta hoon
12/01/25, 11:00 AM - Priya: okay :(
12/01/25, 11:01 AM - Rahul: kya hua ab?
12/01/25, 11:02 AM - Priya: kuch nahi, it's fine
12/01/25, 11:15 AM - Rahul: drama mat kar
12/01/25, 11:16 AM - Priya: seriously Rahul, I'm done explaining myself
12/01/25, 11:18 AM - Rahul: toh mat karo, kisne kaha tha
12/01/25, 11:20 AM - Priya: you know what, forget it
12/01/25, 11:21 AM - Rahul: haan theek hai`;

export const SAMPLE_CHAT_ANALYSIS: ChatJudgeReport = {
  persons: [
    {
      name: "Rahul",
      verdict: "Certified Ego Lord 👑",
      scores: {
        toxicity: 82,
        ego: 90,
        attitude: 88,
        love: 15,
        hate: 75,
        humor: 20,
        dominance: 85,
        coldness: 70
      },
      evidence: [
        {
          trait: "ego",
          quote: "main hi galat hoon hamesha, haina?",
          explanation: "Shifts blame and takes a victim-like sarcastic stance rather than acknowledging Priya's perspective."
        },
        {
          trait: "attitude",
          quote: "drama mat kar",
          explanation: "Dismisses Priya's genuine emotional exhaustion as mere 'drama' instead of displaying empathy or listening."
        },
        {
          trait: "coldness",
          quote: "dekhta hoon",
          explanation: "Responds with cold, dry, passive-aggressive disinterest when Priya tries to reconcile by suggesting lunch together."
        }
      ],
      roast: "Bhai ka ego Mt. Everest se uncha hai, par maturity gully cricket ke bache jitni! Sarcastic 'victim card' khelne mein Gold medal milna chahiye isko. 'Drama mat kar' bolkar khud daily soaps ke characters se zyada meltdown de raha hai. Ek simple lunch invite par 'dekhta hoon' bolkar aise bhav kha raha hai jaise Bill Gates ka next meeting schedule block kiya ho!",
      redFlags: [
        "Victim card mentality ('main hi galat hoon hamesha, haina?')",
        "Labeling normal emotional expression as drama ('drama mat kar')",
        "Extreme dry/cold avoidance response ('dekhta hoon')"
      ],
      greenFlags: [
        "Keeps response time fast",
        "Clear and direct with boundaries (even if rude)"
      ]
    },
    {
      name: "Priya",
      verdict: "Too Pure For This 😇",
      scores: {
        toxicity: 20,
        ego: 25,
        attitude: 30,
        love: 80,
        hate: 35,
        humor: 45,
        dominance: 35,
        coldness: 28
      },
      evidence: [
        {
          trait: "love",
          quote: "sorry yaar traffic tha",
          explanation: "Apologizes immediately and tries to explain the circumstances politely to de-escalate Rahul's frustration."
        },
        {
          trait: "coldness",
          quote: "kuch nahi, it's fine",
          explanation: "Eventually shuts down emotional availability under consistent criticism, retreating to standard dry text replies."
        }
      ],
      roast: "Aapka traffic wala bahaana itna predictable hai ki ab Google Maps ko bhi aapse guidelines leni chahiye. Itna seedha aur 'pure soul' banne ki koshish thik hai, par behen... itni bhi door mat bano ki samne wala aapko footmat samajhne lage. 'Drama mat kar' sunkar bhi reply mein sorry bol rahi ho? Thoda self-respect market se udhaar le lo please!",
      redFlags: [
        "Puts up with too much toxicity without setting strong boundaries",
        "Apologizes constantly even when not primarily at fault ('sorry baba sorry, khush?')"
      ],
      greenFlags: [
        "Tries to reconcile and heal ties by inviting him to lunch ('aaj lunch saath karein?')",
        "Values accountability and polite greetings/explanations ('sorry yaar traffic tha')",
        "Keeps a high degree of patience before emotionally shutting down"
      ]
    }
  ],
  relationship: {
    "score": 32,
    "label": "Complicated",
    "summary": "Rahul carries heavy resentment and displays dominant, dismissive behaviors, making open communication very difficult. Priya initially attempts to make compromises and apologize, but eventually withdraws emotionally due to the hostile and condescending dynamic. The relationship is currently complicated and shows signs of recurring toxicity if patterns aren't broken."
  },
  apologyVerdict: {
    shouldApologizeFirst: "Rahul",
    reasoning: "Rahul has shown extreme dismissiveness, condescending remarks, and passive-aggressive behavior. Priya already apologized multiple times (even saying 'sorry baba sorry, khush?') and initiated reconciliation with a lunch invite. Rahul shut her down with 'dekhta hoon' and 'drama mat kar'. Logically, Rahul needs to drop his ego and apologize first to restore respect."
  },
  relationshipAdvice: {
    actionableSteps: [
      "Rahul needs to stop calling normal feelings 'drama' and listen with empathy rather than immediate defensive combat.",
      "Priya must stop over-apologizing for minor things and set firm, respectful boundaries when she's being dismissed.",
      "Ditch the defensive victim-statement cards like 'main hi galat hoon hamesha' and focus on addressing the current specific issue."
    ],
    coupleChallenge: "The 48-Hour No-Deflection Challenge: For the next 2 days, both partners cannot use passive sarcasm or 'dekhta hoon' avoidances. You must either reply with warm honesty or say 'I need some time to think, let's talk in 30 minutes.'"
  }
};
