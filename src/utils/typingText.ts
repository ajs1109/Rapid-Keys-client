import { faker } from '@faker-js/faker';
import { LoremIpsum } from 'lorem-ipsum';

const loremGenerator = new LoremIpsum({
  sentencesPerParagraph: {
    max: 5,
    min: 3,
  },
  wordsPerSentence: {
    max: 12,
    min: 5,
  },
});

export const generateTypingText = (count: number) => {
  const textOptions = [
    () =>
      faker.lorem.paragraph(4) +
      ' ' +
      faker.hacker.phrase() +
      ' ' +
      faker.lorem.paragraph(2),
    () =>
      faker.lorem.paragraph(3) +
      ' ' +
      faker.company.catchPhrase() +
      ' ' +
      faker.lorem.paragraph(2),
    () => loremGenerator.generateParagraphs(2),
    () => faker.lorem.paragraphs(2, '\n').replace(/\n/g, ' '),
    () =>
      `The ${faker.science.chemicalElement().name} experiment showed promising results. ` +
      faker.lorem.paragraph(4) +
      ` Scientists at ${faker.company.name()} continue to research this phenomenon.`,
  ];

  const selectedGenerator = textOptions[Math.floor(Math.random() * textOptions.length)];
  let generatedText = selectedGenerator();
  const words = generatedText.split(' ');

  if (words.length > count) {
    generatedText = `${words.slice(0, count).join(' ')}.`;
  }

  return generatedText;
};
