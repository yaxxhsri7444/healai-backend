// Simple sentiment analysis based on keywords
// For production, consider using libraries like 'sentiment' or 'natural'

const positiveWords = [
  'happy', 'joy', 'love', 'excited', 'great', 'wonderful', 'amazing', 
  'fantastic', 'excellent', 'good', 'glad', 'pleased', 'delighted',
  'cheerful', 'blessed', 'grateful', 'thankful', 'awesome', 'brilliant',
  'perfect', 'beautiful', 'lovely', 'enjoy', 'fun', 'smile', 'laugh',
  'celebrating', 'thrilled', 'ecstatic', 'proud', 'optimistic', 'hope'
];

const negativeWords = [
  'sad', 'angry', 'hate', 'depressed', 'upset', 'bad', 'terrible',
  'awful', 'horrible', 'worried', 'anxious', 'stress', 'fear', 'scared',
  'hurt', 'pain', 'crying', 'lonely', 'miserable', 'disappointed',
  'frustrated', 'annoyed', 'tired', 'exhausted', 'sick', 'ill',
  'struggling', 'difficult', 'hard', 'problem', 'issue', 'fail'
];

export function analyzeMood(text) {
  if (!text || typeof text !== 'string') {
    return 'neutral';
  }

  const lowerText = text.toLowerCase();
  
  // Count positive and negative words
  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      positiveScore += matches.length;
    }
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      negativeScore += matches.length;
    }
  });

  // Check for emoticons
  const happyEmoticons = ['😊', '😄', '😃', '🙂', '😁', '🥰', '😍', '🎉', '👍', '❤️', '💕'];
  const sadEmoticons = ['😢', '😭', '😞', '😔', '😟', '😩', '😫', '💔', '👎'];

  happyEmoticons.forEach(emoticon => {
    if (lowerText.includes(emoticon)) {
      positiveScore += 2;
    }
  });

  sadEmoticons.forEach(emoticon => {
    if (lowerText.includes(emoticon)) {
      negativeScore += 2;
    }
  });

  // Determine mood based on scores
  if (positiveScore > negativeScore) {
    return 'happy';
  } else if (negativeScore > positiveScore) {
    return 'sad';
  } else {
    return 'neutral';
  }
}

// Advanced version with intensity scoring (optional)
export function analyzeMoodDetailed(text) {
  if (!text || typeof text !== 'string') {
    return { mood: 'neutral', confidence: 0, scores: { positive: 0, negative: 0 } };
  }

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  // Count words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveScore += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeScore += matches.length;
  });

  // Calculate mood
  const totalScore = positiveScore + negativeScore;
  let mood = 'neutral';
  let confidence = 0;

  if (totalScore > 0) {
    const posRatio = positiveScore / totalScore;
    const negRatio = negativeScore / totalScore;

    if (posRatio > 0.6) {
      mood = 'happy';
      confidence = Math.min(100, posRatio * 100);
    } else if (negRatio > 0.6) {
      mood = 'sad';
      confidence = Math.min(100, negRatio * 100);
    } else {
      mood = 'neutral';
      confidence = 50;
    }
  }

  return {
    mood,
    confidence: Math.round(confidence),
    scores: {
      positive: positiveScore,
      negative: negativeScore
    }
  };
}