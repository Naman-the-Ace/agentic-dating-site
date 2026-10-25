// agent.js — AI agent logic using Google Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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
  const bInterest = (personBAnalysis.interests || ['ideas'])[0];
  const aVibe = personAAnalysis.vibe || 'curious';
  const bVibe = personBAnalysis.vibe || 'thoughtful';
  
  return [
    {
      sender: personAName,
      text: `Hey ${personBName}! I saw you're into ${bInterest.toLowerCase()} — that's something I've been thinking a lot about lately. What got you into it?`,
    },
    {
      sender: personBName,
      text: `Oh wow, small world! I started getting into it a few years back when I realized it connected everything I care about. Your work in ${personAAnalysis.professional_domain?.split(' ')[0] || 'your field'} sounds fascinating — how do you stay creative?`,
    },
    {
      sender: personAName,
      text: `Honestly? ${aHobby} keeps me sane. There's something about stepping away from screens and just being present. What's your go-to way to recharge?`,
    },
    {
      sender: personBName,
      text: `I love that — I'm the same way. I find that my best ideas come when I'm not trying to think at all. Also, your point about being present... I feel like that's rare to find in someone. Are you always this self-aware? 😄`,
    },
    {
      sender: personAName,
      text: `Ha! I try to be. I think it's important — especially in whatever relationship I'm in. I value ${(personAAnalysis.values || ['authenticity'])[0].toLowerCase()} above almost everything. What matters most to you?`,
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
  
  // Try AI conversation, fall back to mock
  let useAI = !!model;
  const conversation = [];
  
  try {
    if (useAI) {
      // Opening message from A
      const opening = await generateOpeningMessage(personA, personB);
      const msg1 = { sender: nameA, sender_id: personA.id, text: opening, timestamp: Date.now() };
      conversation.push(msg1);
      if (onMessage) onMessage(msg1);
      await sleep(800);

      // Reply from B
      const reply1 = await generateReply(personB, personA, conversation);
      const msg2 = { sender: nameB, sender_id: personB.id, text: reply1, timestamp: Date.now() };
      conversation.push(msg2);
      if (onMessage) onMessage(msg2);
      await sleep(800);

      // Follow-up from A
      const followup1 = await generateReply(personA, personB, conversation);
      const msg3 = { sender: nameA, sender_id: personA.id, text: followup1, timestamp: Date.now() };
      conversation.push(msg3);
      if (onMessage) onMessage(msg3);
      await sleep(800);

      // Reply from B
      const reply2 = await generateReply(personB, personA, conversation);
      const msg4 = { sender: nameB, sender_id: personB.id, text: reply2, timestamp: Date.now() };
      conversation.push(msg4);
      if (onMessage) onMessage(msg4);
      await sleep(800);

      // Closing from A
      const closing = await generateReply(personA, personB, conversation);
      const msg5 = { sender: nameA, sender_id: personA.id, text: closing, timestamp: Date.now() };
      conversation.push(msg5);
      if (onMessage) onMessage(msg5);
    } else {
      throw new Error('No AI model');
    }
  } catch (err) {
    console.log('Using mock conversation:', err.message);
    // Use mock conversation
    if (conversation.length === 0) {
      const mockMsgs = generateMockConversation(nameA, nameB, personA.analysis || {}, personB.analysis || {});
      for (const msg of mockMsgs) {
        const fullMsg = {
          sender: msg.sender,
          sender_id: msg.sender === nameA ? personA.id : personB.id,
          text: msg.text,
          timestamp: Date.now(),
        };
        conversation.push(fullMsg);
        if (onMessage) onMessage(fullMsg);
        await sleep(600);
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
