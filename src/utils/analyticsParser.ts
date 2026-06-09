export interface ParsedMessage {
  sender: string;
  text: string;
  timestampStr: string;
  date: Date | null;
}

export interface PersonaAnalytics {
  name: string;
  messageCount: number;
  avgResponseTimeMin: number; // minutes
  ghostingStatus: string;
  topWords: { word: string; count: number }[];
  emojis: { emoji: string; count: number }[];
  emojiCount: number;
  conversationStarters: number;
  timeDistribution: {
    lateNight: number; // 11 PM - 4 AM
    morning: number;   // 5 AM - 11 AM
    afternoon: number; // 12 PM - 5 PM
    evening: number;   // 6 PM - 10 PM
  };
}

export interface ChatAnalyticsReport {
  personas: PersonaAnalytics[];
  totalMessages: number;
}

// Common Hindi/Hinglish and English list of stop words to filter for the word analysis
const STOP_WORDS = new Set([
  'the', 'a', 'and', 'is', 'in', 'to', 'of', 'it', 'this', 'that', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'my', 'your', 'for', 'on', 'with', 'as', 'at', 'by', 'an', 'be', 'this', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'if', 'then', 'else', 'so', 'up', 'down', 'out', 'no', 'not', 'can', 'cant', 'will', 'would', 'should', 'could', 'about', 'more', 'some', 'any', 'than', 'then', 'very', 'too', 'just', 'get', 'like', 'there', 'their', 'them', 'who', 'what', 'which', 'where', 'when', 'why', 'how',
  'hai', 'bhi', 'se', 'ko', 'ki', 'ke', 'ka', 'ne', 'par', 'pe', 'me', 'mein', 'bhai', 'yaar', 'toh', 'aur', 'hi', 'kuch', 'ab', 'tum', 'main', 'usne', 'itna', 'tune', 'aaj', 'baba', 'mujhe', 'mat', 'bolo', 'haan', 'theek', 'hoon', 'tha', 'thi', 'the', 'bhav', 'ho', 'hamesha', 'na', 'kar', 'karo', 'karne', 'raha', 'rahi', 'saath', 'karein', 'dekhta', 'fine', 'kya', 'hua', 'its', 'drama', 'done', 'explaining', 'myself', 'kisne', 'kaha', 'you', 'know', 'what', 'forget', 'babe', 're', 'bhee', 'gaya', 'gayi', 'hoke', 'chal', 'chalo', 'hum', 'aap', 'mere', 'tere', 'tera', 'meri', 'apna', 'apni', 'isse', 'usse', 'sab', 'sabse', 'yeh', 'woh', 'per', 'to', 'ya'
]);

function parseTimestamp(timeStr: string): Date | null {
  try {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const ampm = timeMatch[4];

    if (ampm) {
      if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
    }

    const dateMatch = timeStr.match(/(\d{1,4})[\/.-](\d{1,2})[\/.-](\d{1,4})/);
    let date = new Date();
    if (dateMatch) {
      const part1 = parseInt(dateMatch[1], 10);
      const part2 = parseInt(dateMatch[2], 10);
      const part3 = parseInt(dateMatch[3], 10);

      if (part1 > 1000) {
        date.setFullYear(part1, part2 - 1, part3);
      } else {
        const year = part3 < 100 ? 2000 + part3 : part3;
        date.setFullYear(year, part2 - 1, part1);
      }
    }

    date.setHours(hours, minutes, seconds, 0);
    return date;
  } catch (e) {
    return null;
  }
}

// Regex to identify emojis in text
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu;

export function parseChatAndCalculateAnalytics(chatText: string): ChatAnalyticsReport {
  const lines = chatText.split("\n");
  const messages: ParsedMessage[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let parsed = false;

    // 1. Android/General Format: "12/01/25, 10:00 AM - Rahul: Message content"
    if (line.includes(" - ")) {
      const dashIndex = line.indexOf(" - ");
      const beforeDash = line.slice(0, dashIndex).trim();
      const afterDash = line.slice(dashIndex + 3).trim();
      const colonIndex = afterDash.indexOf(":");

      if (colonIndex !== -1) {
        const sender = afterDash.slice(0, colonIndex).trim();
        const text = afterDash.slice(colonIndex + 1).trim();
        const date = parseTimestamp(beforeDash);
        messages.push({
          sender,
          text,
          timestampStr: beforeDash,
          date
        });
        parsed = true;
      }
    }

    // 2. iOS Bracket Format: "[12/01/25, 10:00:15 AM] Rahul: Message content"
    if (!parsed && line.startsWith("[") && line.includes("]")) {
      const closeBracketIndex = line.indexOf("]");
      const beforeBracket = line.slice(1, closeBracketIndex).trim();
      const afterBracket = line.slice(closeBracketIndex + 1).trim();
      const colonIndex = afterBracket.indexOf(":");

      if (colonIndex !== -1) {
        const sender = afterBracket.slice(0, colonIndex).trim();
        const text = afterBracket.slice(colonIndex + 1).trim();
        const date = parseTimestamp(beforeBracket);
        messages.push({
          sender,
          text,
          timestampStr: beforeBracket,
          date
        });
        parsed = true;
      }
    }

    // 3. Fallback / Multi-line continuations
    if (!parsed && messages.length > 0) {
      messages[messages.length - 1].text += " " + line;
    }
  }

  // Group messages by sender
  const personNames = Array.from(new Set(messages.map(m => m.sender)));
  
  const responseTimes: { [sender: string]: number[] } = {};
  const wordCounts: { [sender: string]: { [word: string]: number } } = {};
  const emojiCounts: { [sender: string]: { [emoji: string]: number } } = {};
  const starters: { [sender: string]: number } = {};
  const timeDist: { [sender: string]: PersonaAnalytics["timeDistribution"] } = {};

  // Initialize data structures
  for (const name of personNames) {
    responseTimes[name] = [];
    wordCounts[name] = {};
    emojiCounts[name] = {};
    starters[name] = 0;
    timeDist[name] = { lateNight: 0, morning: 0, afternoon: 0, evening: 0 };
  }

  // Calculate Starters, Word/Emoji frequencies, and Time Distributions
  let lastMsg: ParsedMessage | null = null;
  const GAP_FOR_NEW_CONVERSATION_MS = 4 * 60 * 60 * 1000; // 4 Hours

  for (let idx = 0; idx < messages.length; idx++) {
    const msg = messages[idx];
    const sender = msg.sender;

    // Conversation starter detection
    if (idx === 0) {
      starters[sender] = (starters[sender] || 0) + 1;
    } else if (lastMsg && msg.date && lastMsg.date) {
      const gap = msg.date.getTime() - lastMsg.date.getTime();
      if (gap > GAP_FOR_NEW_CONVERSATION_MS) {
        starters[sender] = (starters[sender] || 0) + 1;
      }
    }

    // Time pattern classification
    if (msg.date) {
      const hr = msg.date.getHours();
      if (hr >= 23 || hr < 5) {
        timeDist[sender].lateNight++;
      } else if (hr >= 5 && hr < 12) {
        timeDist[sender].morning++;
      } else if (hr >= 12 && hr < 18) {
        timeDist[sender].afternoon++;
      } else {
        timeDist[sender].evening++;
      }
    }

    // Response times calculation
    if (idx > 0 && lastMsg && lastMsg.sender !== sender && msg.date && lastMsg.date) {
      const diffMin = (msg.date.getTime() - lastMsg.date.getTime()) / 60000;
      // Filter out gaps longer than 12 hours (720 min) as they don't capture direct conversational pacing
      if (diffMin > 0 && diffMin < 720) {
        responseTimes[sender].push(diffMin);
      }
    }

    // Emoji search
    const emojisFound = msg.text.match(EMOJI_REGEX) || [];
    for (const em of emojisFound) {
      emojiCounts[sender][em] = (emojiCounts[sender][em] || 0) + 1;
    }

    // Word counts
    const cleanWords = msg.text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 3);

    for (const word of cleanWords) {
      if (!STOP_WORDS.has(word)) {
        wordCounts[sender][word] = (wordCounts[sender][word] || 0) + 1;
      }
    }

    lastMsg = msg;
  }

  // Formatting final results
  const personas: PersonaAnalytics[] = personNames.map(name => {
    const listResponse = responseTimes[name] || [];
    const avgResponseTimeMin = listResponse.length > 0 
      ? Math.round(listResponse.reduce((a, b) => a + b, 0) / listResponse.length) 
      : 0;

    let ghostingStatus = "Average Responder 💬";
    if (listResponse.length === 0) {
      ghostingStatus = "Ghosting Expert 👻";
    } else if (avgResponseTimeMin <= 2) {
      ghostingStatus = "Flash Reply speed-lord ⚡";
    } else if (avgResponseTimeMin <= 10) {
      ghostingStatus = "Fast & Serious 🏃";
    } else if (avgResponseTimeMin <= 45) {
      ghostingStatus = "Chill / Normal pacing ☕";
    } else if (avgResponseTimeMin <= 180) {
      ghostingStatus = "Professional ghoster in training ⏳";
    } else {
      ghostingStatus = "Swaying ghosting professional 👻";
    }

    // Word frequencies sorted
    const topWords = Object.entries(wordCounts[name] || {})
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Emojis sorted
    const topEmojis = Object.entries(emojiCounts[name] || {})
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const totalEmojisUsed = Object.values(emojiCounts[name] || {}).reduce((sum, c) => sum + c, 0);

    return {
      name,
      messageCount: messages.filter(m => m.sender === name).length,
      avgResponseTimeMin,
      ghostingStatus,
      topWords,
      emojis: topEmojis,
      emojiCount: totalEmojisUsed,
      conversationStarters: starters[name] || 0,
      timeDistribution: timeDist[name]
    };
  });

  return {
    personas,
    totalMessages: messages.length
  };
}
