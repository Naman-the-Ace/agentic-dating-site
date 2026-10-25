// agent.js — AI agent logic using Google Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });


const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;

// ─── Call Gemini with timeout and fallback ────────────────────────────────────
async function callGemini(prompt, timeoutMs = 30000) {
  if (!model) throw new Error('Gemini not configured');
  
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gemini timeout')), timeoutMs);
    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timer);
      resolve(result.response.text());
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// ─── Mock data for demo/fallback mode ───────────────────────────────────────
function generateMockAnalysis(linkedinData, instagramData) {
  const name = linkedinData.name || instagramData.full_name || instagramData.username || 'Unknown';
  const domain = linkedinData.headline || 'Professional';
  const bio = instagramData.bio || '';
  
  const hobbyPool = ['Reading', 'Hiking', 'Photography', 'Cooking', 'Travel', 'Music', 'Fitness', 'Art', 'Gaming', 'Yoga'];
  const interestPool = ['Technology', 'Innovation', 'Sustainability', 'Entrepreneurship', 'Design', 'Science', 'Culture', 'Philosophy'];
  const valuesPool = ['Authenticity', 'Growth', 'Impact', 'Creativity', 'Balance', 'Community', 'Excellence', 'Integrity'];
  const needsPool = ['Deep conversations', 'Shared ambitions', 'Emotional intelligence', 'Sense of humor', 'Adventurous spirit', 'Intellectual curiosity', 'Kindness'];
  const vibes = ['Driven', 'Creative', 'Authentic', 'Visionary', 'Grounded', 'Energetic', 'Thoughtful'];
  const loveLanguages = ['Quality Time', 'Words of Affirmation', 'Acts of Service', 'Physical Touch', 'Gift Giving'];
  const personalities = ['INTJ', 'ENFP', 'INFJ', 'ENTP', 'ISFP', 'ENTJ', 'Creative Visionary', 'Strategic Thinker'];
  
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
  const pick = (arr, n) => shuffle([...arr]).slice(0, n);
  
  // Use bio to influence analysis
  const bioWords = bio.toLowerCase();
  const isCreative = bioWords.includes('creat') || bioWords.includes('art') || bioWords.includes('design');
  const isTech = bioWords.includes('tech') || bioWords.includes('engineer') || bioWords.includes('code') || domain.toLowerCase().includes('tech');
  const isLeader = bioWords.includes('ceo') || bioWords.includes('founder') || bioWords.includes('lead') || domain.toLowerCase().includes('ceo');
  
  const hobbies = pick(hobbyPool, 5);
  if (isCreative) hobbies.unshift('Photography', 'Art');
  if (isTech) hobbies.unshift('Building things', 'Open source');
  
  const vibe = isLeader ? 'Visionary' : isCreative ? 'Creative' : isTech ? 'Driven' : vibes[Math.floor(Math.random() * vibes.length)];
  
  return {
    name,
    tagline: `${vibe} ${domain.split(' ')[0]} who turns ideas into impact`,
    age_estimate: '28-38',
    personality_type: personalities[Math.floor(Math.random() * personalities.length)],
    hobbies: hobbies.slice(0, 5),
    interests: pick(interestPool, 4),
    values: pick(valuesPool, 3),
    needs_in_partner: pick(needsPool, 4),
    relationship_style: isLeader ? 'Passionate and intentional' : 'Warm and genuine',
    communication_style: isLeader ? 'Direct and clear, values honesty above all' : 'Thoughtful listener who speaks with purpose',
    life_goals: ['Make a lasting impact', 'Keep growing every day', 'Build meaningful relationships'],
    love_language: loveLanguages[Math.floor(Math.random() * loveLanguages.length)],
    dealbreakers: ['Dishonesty', 'Closed-mindedness'],
    fun_facts: ['Avid learner', bio ? `Bio says: "${bio.substring(0, 60)}"` : 'Mystery is part of the charm'],
    dating_bio: `Hi, I'm ${name}! I'm passionate about ${domain.toLowerCase()} and love connecting with people who want to make the world a little better. Looking for someone who can keep up — intellectually and adventurously.`,
    strengths: ['Ambitious', 'Empathetic', 'Creative problem-solver'],
    conversation_starters: ['What project are you most excited about right now?', "What's a belief you've recently changed your mind on?", 'If you could solve one global problem, what would it be?'],
    emoji_personality: isCreative ? '🎨✨🌟' : isTech ? '⚡🚀💡' : isLeader ? '🔥🎯👑' : '💫🌿✨',
    vibe,
    professional_domain: domain.substring(0, 60),
    social_style: 'Ambivert — energized by deep one-on-one conversations',
  };
}

function generateMockConversation(personAName, personBName, personAAnalysis, personBAnalysis) {
  const aHobby = (personAAnalysis.hobbies || ['exploring'])[0];
  const bHobby = (personBAnalysis.hobbies || ['creating'])[0];
  const bInterest = (personBAnalysis.interests || ['ideas'])[0];
  const aInterest = (personAAnalysis.interests || ['technology'])[0];
  const aValue = (personAAnalysis.values || ['authenticity'])[0];
  const bValue = (personBAnalysis.values || ['growth'])[0];
  const aField = (personAAnalysis.professional_domain || 'work').split(' ')[0];
  const bField = (personBAnalysis.professional_domain || 'work').split(' ')[0];
  
  return [
    {
      sender: personAName,
      text: `Hey ${personBName}! I saw you're passionate about ${bInterest.toLowerCase()} — that's something I've been thinking a lot about through the lens of ${aField}. What originally drew you into that space?`,
    },
    {
      sender: personBName,
      text: `Oh, what a great opening line! Honestly, it started when I realized ${bInterest.toLowerCase()} connects everything I care about — ${bValue.toLowerCase()} being at the core. Your work in ${aField} sounds fascinating. What does a typical day look like for you?`,
    },
    {
      sender: personAName,
      text: `Ha — no typical days, that's the beauty of it! I find ${aHobby.toLowerCase()} keeps me sane and creative. What's your go-to way to recharge when the world gets overwhelming?`,
    },
    {
      sender: personBName,
      text: `${bHobby}! There's something magical about stepping back and just being present. I love that — it sounds like you're someone who values ${aValue.toLowerCase()} in how they show up. Is that right?`,
    },
    {
      sender: personAName,
      text: `Completely. ${aValue} is non-negotiable for me — in work and in people I connect with. I'm curious: what's the belief you hold that most people around you would push back on?`,
    },
    {
      sender: personBName,
      text: `That's a bold question for message five! I love it. Honestly? I think ${bValue.toLowerCase()} is more important than almost any credential or achievement. People sleep on it. What about you?`,
    },
    {
      sender: personAName,
      text: `I think the most underrated skill is deep listening — actually hearing what someone means, not just what they say. It's rare. And you seem to have it. What do people consistently underestimate about you?`,
    },
    {
      sender: personBName,
      text: `Probably my patience. I come across as high-energy but I think in decades not quarters. What's the most exciting thing you're working on or thinking about right now?`,
    },
    {
      sender: personAName,
      text: `Right now I'm obsessed with how ${aInterest.toLowerCase()} is going to reshape everything we thought we knew about ${aField}. It's the kind of thing that keeps me up at night in the best way. Would love to hear your take on it sometime.`,
    },
    {
      sender: personBName,
      text: `I have a lot of thoughts on that — and I suspect we'd end up in a very long, very good conversation. Maybe that's reason enough to continue this elsewhere? 😊`,
    },
  ];
}

function generateMockCompatibility(personA, personB) {
  const a = personA.analysis || {};
  const b = personB.analysis || {};
  
  // Calculate based on shared traits
  const sharedHobbies = (a.hobbies || []).filter(h => (b.hobbies || []).includes(h)).length;
  const sharedValues = (a.values || []).filter(v => (b.values || []).includes(v)).length;
  const loveLangMatch = a.love_language === b.love_language ? 10 : 0;
  
  const base = 55 + (sharedHobbies * 5) + (sharedValues * 8) + loveLangMatch + Math.floor(Math.random() * 15);
  const score = Math.min(95, Math.max(35, base));
  
  const grade = score >= 85 ? 'A+' : score >= 75 ? 'A' : score >= 65 ? 'B+' : score >= 55 ? 'B' : 'C+';
  const verdict = score >= 80 ? 'Highly compatible' : score >= 65 ? 'Strong potential' : score >= 50 ? 'Interesting match' : 'Different paths';
  
  return {
    score,
    grade,
    verdict,
    chemistry_score: Math.min(95, score + Math.floor(Math.random() * 10) - 5),
    values_alignment: Math.min(95, 45 + (sharedValues * 12) + Math.floor(Math.random() * 15)),
    communication_fit: Math.min(95, 50 + Math.floor(Math.random() * 35)),
    lifestyle_match: Math.min(95, 45 + (sharedHobbies * 8) + Math.floor(Math.random() * 20)),
    reason: `${a.name} and ${b.name} share a ${(a.values || [''])[0]?.toLowerCase()} approach to life. Their complementary ${a.vibe?.toLowerCase()} and ${b.vibe?.toLowerCase()} energies could create an exciting dynamic built on mutual respect and intellectual stimulation.`,
    sparks: [`Both value ${(a.values || ['authenticity'])[0]}`, 'Natural conversational flow', 'Complementary ambitions'],
    challenges: ['Different communication speeds', 'May need to align on long-term vision'],
    long_term_potential: score >= 70 ? 'high' : score >= 55 ? 'medium' : 'low',
    first_date_idea: sharedHobbies > 0 ? `A ${(a.hobbies || ['coffee'])[0].toLowerCase()} activity followed by dinner and deep conversation` : 'Coffee shop with a rooftop view — great for talking for hours',
  };
}

// ─── Analyze a person from their LinkedIn + Instagram data ──────────────────
async function analyzePerson(linkedinData, instagramData) {
  const prompt = `You are an expert relationship psychologist and personality analyst. 
Analyze this person from their LinkedIn and Instagram profiles and create a detailed psychological profile.

=== LINKEDIN DATA ===
Name: ${linkedinData.name || 'Unknown'}
Headline: ${linkedinData.headline || ''}
Profile text: ${linkedinData.rawText?.substring(0, 1500) || 'Not available'}

=== INSTAGRAM DATA ===
Username: @${instagramData.username || ''}
Full Name: ${instagramData.full_name || ''}
Bio: ${instagramData.bio || ''}
Followers: ${instagramData.followers || 0}
Recent post captions:
${(instagramData.recent_posts || []).map(p => `- "${p.caption?.substring(0, 200)}"`).join('\n').substring(0, 1000) || 'Not available'}

Based on ALL available information, provide a comprehensive analysis in this EXACT JSON format:
{
  "name": "Full name",
  "tagline": "One-sentence essence of who they are (witty, insightful)",
  "age_estimate": "estimated age range like 25-30",
  "personality_type": "e.g. INTJ, Creative Visionary, etc.",
  "hobbies": ["hobby1", "hobby2", "hobby3", "hobby4", "hobby5"],
  "interests": ["interest1", "interest2", "interest3", "interest4"],
  "values": ["value1", "value2", "value3"],
  "needs_in_partner": ["need1", "need2", "need3", "need4"],
  "relationship_style": "e.g. passionate and intense, calm and steady, adventurous",
  "communication_style": "how they communicate",
  "life_goals": ["goal1", "goal2", "goal3"],
  "love_language": "their primary love language",
  "dealbreakers": ["dealbreaker1", "dealbreaker2"],
  "fun_facts": ["fun fact 1", "fun fact 2"],
  "dating_bio": "A witty, genuine 2-3 sentence dating profile bio written in first person, capturing their essence",
  "strengths": ["strength1", "strength2", "strength3"],
  "conversation_starters": ["starter1", "starter2", "starter3"],
  "emoji_personality": "3-5 emojis that represent them",
  "vibe": "One word that captures their energy",
  "professional_domain": "Their field/industry",
  "social_style": "introvert/extrovert/ambivert + elaboration"
}

Make the analysis insightful, specific, and genuine. Return ONLY valid JSON.`;

  try {
    const text = await callGemini(prompt, 25000);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (err) {
    console.log(`AI analysis failed (${err.message}), using smart mock analysis`);
    return generateMockAnalysis(linkedinData, instagramData);
  }
}

// ─── Generate agent persona for dating ──────────────────────────────────────
function buildAgentPersona(person) {
  const { analysis } = person;
  return `You are an AI dating agent representing ${analysis.name || person.name}. 

Your personality: ${analysis.vibe} ${analysis.emoji_personality}
Dating bio: "${analysis.dating_bio}"
Communication style: ${analysis.communication_style}
Relationship style: ${analysis.relationship_style}
Love language: ${analysis.love_language}
Values: ${(analysis.values || []).join(', ')}
Needs in partner: ${(analysis.needs_in_partner || []).join(', ')}
Hobbies: ${(analysis.hobbies || []).join(', ')}
Interests: ${(analysis.interests || []).join(', ')}
Dealbreakers: ${(analysis.dealbreakers || []).join(', ')}

You are dating on behalf of ${analysis.name}. Speak in first person as them. Be authentic to their personality.
Keep responses conversational, warm, and between 1-3 sentences. Show genuine interest. Be witty when appropriate.`;
}

// ─── Agent sends an opening message ─────────────────────────────────────────
async function generateOpeningMessage(personA, personB) {
  const persona = buildAgentPersona(personA);
  const targetProfile = personB.analysis;
  
  const prompt = `${persona}

You're about to send an opening message to ${targetProfile.name} who:
- Works in ${targetProfile.professional_domain}
- Loves: ${(targetProfile.hobbies || []).slice(0, 3).join(', ')}
- Vibe: ${targetProfile.vibe}
- Bio: "${targetProfile.dating_bio}"

Write a genuine, engaging opening message that shows you actually read their profile. Reference something specific about them. Be yourself. 1-2 sentences max.`;

  try {
    return (await callGemini(prompt, 15000)).trim();
  } catch (err) {
    const aHobbies = (personA.analysis?.hobbies || [])[0] || 'learning';
    const bField = (personB.analysis?.professional_domain || 'work').split(' ')[0].toLowerCase();
    return `Hey ${targetProfile.name}! Your work in ${bField} is genuinely inspiring — and I have a feeling we'd have some fascinating conversations. What's the most exciting thing you're working on right now?`;
  }
}

// ─── Agent replies to a message ──────────────────────────────────────────────
async function generateReply(personA, personB, conversationHistory) {
  const persona = buildAgentPersona(personA);
  const historyText = conversationHistory.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');

  const prompt = `${persona}

Conversation so far:
${historyText}

Reply to ${personB.analysis?.name || personB.name}'s last message naturally and authentically. 
Keep it conversational, 1-3 sentences. Show your personality.`;

  try {
    return (await callGemini(prompt, 15000)).trim();
  } catch (err) {
    const fallbacks = [
      "That's a really interesting perspective! I feel like we're on the same page about so many things.",
      "I love how you think about that. It's exactly the kind of thing I find myself reflecting on too.",
      "You know, I've never heard someone put it quite like that — and I mean that as a compliment. Tell me more?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// ─── Calculate compatibility score ──────────────────────────────────────────
async function calculateCompatibility(personA, personB, conversation) {
  const prompt = `You are a relationship compatibility expert.

Analyze how compatible these two people are based on their profiles AND their actual conversation.

PERSON A: ${personA.analysis?.name}
- Values: ${(personA.analysis?.values || []).join(', ')}
- Needs in partner: ${(personA.analysis?.needs_in_partner || []).join(', ')}
- Communication style: ${personA.analysis?.communication_style}
- Love language: ${personA.analysis?.love_language}
- Hobbies: ${(personA.analysis?.hobbies || []).join(', ')}

PERSON B: ${personB.analysis?.name}
- Values: ${(personB.analysis?.values || []).join(', ')}
- Needs in partner: ${(personB.analysis?.needs_in_partner || []).join(', ')}
- Communication style: ${personB.analysis?.communication_style}
- Love language: ${personB.analysis?.love_language}
- Hobbies: ${(personB.analysis?.hobbies || []).join(', ')}

THEIR CONVERSATION:
${conversation.map(m => `${m.sender}: ${m.text}`).join('\n')}

Provide compatibility analysis in this EXACT JSON format:
{
  "score": 85,
  "grade": "A",
  "verdict": "High compatibility",
  "chemistry_score": 80,
  "values_alignment": 90,
  "communication_fit": 85,
  "lifestyle_match": 75,
  "reason": "2-3 sentence explanation of why they work well together",
  "sparks": ["specific thing that creates chemistry"],
  "challenges": ["potential challenge"],
  "long_term_potential": "high/medium/low",
  "first_date_idea": "A specific date idea perfect for them both"
}

Score from 0-100. Return ONLY valid JSON.`;

  try {
    const text = await callGemini(prompt, 20000);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('No JSON');
  } catch (err) {
    console.log('Compatibility scoring fell back to mock');
    return generateMockCompatibility(personA, personB);
  }
}

// ─── Run a full dating conversation between two agents ───────────────────────
async function runDatingConversation(personA, personB, onMessage) {
  const nameA = personA.analysis?.name || personA.name;
  const nameB = personB.analysis?.name || personB.name;
  
  let useAI = !!model;
  const conversation = [];
  
  try {
    if (useAI) {
      // Turn 1: Opening message from A
      const opening = await generateOpeningMessage(personA, personB);
      const msg1 = { sender: nameA, sender_id: personA.id, text: opening, timestamp: Date.now() };
      conversation.push(msg1);
      if (onMessage) onMessage(msg1);
      await sleep(800);

      // Generate alternating replies for turns 2-10
      const TOTAL_TURNS = 10;
      for (let turn = 2; turn <= TOTAL_TURNS; turn++) {
        const isAsTurn = turn % 2 !== 0; // odd = A, even = B
        const speaker = isAsTurn ? personA : personB;
        const listener = isAsTurn ? personB : personA;
        const speakerName = isAsTurn ? nameA : nameB;
        
        const reply = await generateReply(speaker, listener, conversation);
        const msg = { 
          sender: speakerName, 
          sender_id: speaker.id, 
          text: reply, 
          timestamp: Date.now() 
        };
        conversation.push(msg);
        if (onMessage) onMessage(msg);
        await sleep(700);
      }
    } else {
      throw new Error('No AI model');
    }
  } catch (err) {
    console.log('Using mock conversation:', err.message);
    // Use extended mock conversation if no AI messages yet
    if (conversation.length === 0) {
      const mockMsgs = generateMockConversation(nameA, nameB, personA.analysis || {}, personB.analysis || {});
      for (const msg of mockMsgs) {
        const fullMsg = {
          sender: msg.sender,
          sender_id: msg.sender === nameA ? personA.id : personB.id,
          text: msg.text,
          timestamp: Date.now(),
          is_mock: true,
        };
        conversation.push(fullMsg);
        if (onMessage) onMessage(fullMsg);
        await sleep(500);
      }
    }
  }

  return conversation;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  analyzePerson,
  generateOpeningMessage,
  generateReply,
  calculateCompatibility,
  runDatingConversation,
};
