const COMMON_WORDS = [
  'about', 'above', 'after', 'again', 'air', 'all', 'also', 'always', 'another', 'answer',
  'around', 'ask', 'back', 'because', 'before', 'begin', 'between', 'both', 'bring', 'build',
  'call', 'can', 'change', 'city', 'close', 'come', 'country', 'create', 'day', 'different',
  'do', 'down', 'each', 'early', 'earth', 'end', 'even', 'every', 'example', 'eye',
  'face', 'fact', 'family', 'feel', 'few', 'find', 'first', 'follow', 'form', 'from',
  'get', 'give', 'good', 'great', 'group', 'grow', 'hand', 'have', 'help', 'here',
  'high', 'home', 'house', 'idea', 'important', 'into', 'just', 'keep', 'kind', 'know',
  'large', 'last', 'learn', 'leave', 'life', 'light', 'like', 'line', 'little', 'long',
  'look', 'make', 'many', 'might', 'more', 'most', 'move', 'much', 'must', 'name',
  'near', 'need', 'never', 'new', 'next', 'night', 'number', 'off', 'often', 'old',
  'only', 'open', 'other', 'over', 'own', 'part', 'people', 'place', 'play', 'point',
  'problem', 'put', 'question', 'quick', 'right', 'run', 'same', 'say', 'school', 'see',
  'seem', 'set', 'show', 'side', 'small', 'something', 'sound', 'start', 'state', 'still',
  'story', 'study', 'such', 'system', 'take', 'tell', 'than', 'that', 'their', 'then',
  'there', 'these', 'thing', 'think', 'this', 'through', 'time', 'together', 'too', 'turn',
  'under', 'until', 'use', 'very', 'want', 'water', 'way', 'well', 'where', 'which',
  'while', 'will', 'with', 'word', 'work', 'world', 'would', 'write', 'year', 'young',
] as const;

export const generateTypingText = (count: number) => {
  const wordCount = Math.max(1, Math.min(400, Math.floor(count)));
  const words: string[] = [];
  let previousIndex = -1;

  for (let index = 0; index < wordCount; index++) {
    let nextIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    if (nextIndex === previousIndex) nextIndex = (nextIndex + 1) % COMMON_WORDS.length;
    words.push(COMMON_WORDS[nextIndex]);
    previousIndex = nextIndex;
  }

  return words.join(' ');
};
