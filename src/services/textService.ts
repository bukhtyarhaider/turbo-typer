import { Difficulty } from '../types';

const TEXT_CORPUS = {
  EASY: [
    "The sun is shining bright today.",
    "I like to read books in the park.",
    "Cats are soft and like to sleep.",
    "Run fast to catch the blue bus.",
    "The sky is blue and the grass is green.",
    "An apple a day keeps the doctor away.",
    "She has a red hat and a warm coat.",
    "Time flies when you are having fun.",
    "Look before you leap across the stream.",
    "Birds sing songs in the morning light.",
    "Fish swim deep in the cool blue sea.",
    "A hot cup of tea is nice on a cold day.",
    "We went to the beach to see the waves.",
    "My dog loves to play fetch with a ball.",
    "Keep your room clean and tidy every day."
  ],
  MEDIUM: [
    "The quick brown fox jumps over the lazy dog, but the dog didn't move.",
    "Consistency is key when learning a new skill; practice makes perfect over time.",
    "Walking through the forest, I heard the rustling of leaves under my feet.",
    "Technology has changed the way we communicate, making the world feel smaller.",
    "Cooking a good meal requires patience, fresh ingredients, and a bit of love.",
    "The stars twinkle in the night sky, creating a beautiful pattern above us.",
    "Reading expands your mind and allows you to travel to different worlds.",
    "Music has the power to heal the soul and bring people together in harmony.",
    "Solving puzzles is a great way to keep your brain sharp and active.",
    "Travel opens your eyes to new cultures, foods, and ways of living life.",
    "Kindness costs nothing but means everything to the person receiving it.",
    "Every journey begins with a single step, so don't be afraid to start now."
  ],
  HARD: [
    "The quantum mechanics of the particle accelerator require precise calibration: 99.9% accuracy is mandatory!",
    "In 2025, the AI revolution transformed industries; however, ethical considerations regarding data privacy (GDPR) remained paramount.",
    "Complex algorithms—like Dijkstra's or A*—optimize pathfinding in graph theory, solving problems efficiently.",
    "The chemical formula for caffeine is C8H10N4O2; it stimulates the central nervous system!",
    "\"To be, or not to be, that is the question,\" pondered Hamlet in Act 3, Scene 1 of Shakespeare's play.",
    "Cryptographic hash functions (e.g., SHA-256) ensure data integrity by producing a unique digest for any input.",
    "Fintech integration requires secure APIs, OAuth 2.0 authentication, and strict compliance with PCI-DSS standards.",
    "The stock market's volatility index (VIX) spiked >20% after the announcement of new fiscal policies.",
    "Photosynthesis: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2; a fundamental process for life on Earth.",
    "Debugging multithreaded applications involving race conditions and deadlocks is a notorious challenge for systems engineers."
  ]
};

export const generateTypingText = async (difficulty: Difficulty = 'MEDIUM'): Promise<string> => {
    const paragraphs = TEXT_CORPUS[difficulty] || TEXT_CORPUS.MEDIUM;
    // Simulate async to match previous interface if needed, or keep it sync but return Promise
    return new Promise((resolve) => {
        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        resolve(paragraphs[randomIndex]);
    });
};
