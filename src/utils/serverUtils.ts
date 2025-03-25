import jwt from 'jsonwebtoken';
import { NODE_ENV, REFRESH_SECRET, TOKEN_SECRET } from "@/config";
import { User } from "@/types/auth";
import { NextResponse } from "next/server";
import { faker } from '@faker-js/faker'
import loremIpsum from 'lorem-ipsum'

// Cookie options
export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
  
export const ACCESS_COOKIE_OPTIONS = {
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  };
  
export const generateAccessToken = (user: User, res: NextResponse) => {
    const accessToken = jwt.sign(
      { user: user },
      TOKEN_SECRET,
      { expiresIn: '15m' }
    );
    res.cookies.set('access_token', accessToken);
    return accessToken;
  }
  
export const generateRefreshToken = (user: User, res:NextResponse) => { 
    const refreshToken = jwt.sign(
      { user: user },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  
    res.cookies.set('refresh_token', refreshToken);
    return refreshToken;
  }
  
export const clearCookies = (res:NextResponse) => {
    res.cookies.delete('refresh_token');
    res.cookies.delete('access_token');
  }

  const loremGenerator = new loremIpsum.LoremIpsum({
    sentencesPerParagraph: {
      max: 5,
      min: 3
    },
    wordsPerSentence: {
      max: 12,
      min: 5
    }
  });

  export const generateTypingText = (count: number) => {
    // Create different types of content to choose from
    const textOptions = [
      // Technology-focused text
      () => faker.lorem.paragraph(4) + ' ' + faker.hacker.phrase() + ' ' + faker.lorem.paragraph(2),
      
      // Business-focused text
      () => faker.lorem.paragraph(3) + ' ' + faker.company.catchPhrase() + ' ' + faker.lorem.paragraph(2),
      
      // Standard lorem ipsum
      () => loremGenerator.generateParagraphs(2),
      
      // More natural-sounding text
      () => faker.lorem.paragraphs(2, '\n').replace(/\n/g, ' '),
      
      // Science-focused text
      () => `The ${faker.science.chemicalElement().name} experiment showed promising results. ` + 
             faker.lorem.paragraph(4) + ` Scientists at ${faker.company.name()} continue to research this phenomenon.`
    ];
    
    // Randomly select one of the text generation methods
    const selectedGenerator = textOptions[Math.floor(Math.random() * textOptions.length)];
    let generatedText = selectedGenerator();
    
    // Ensure text is not too long (target ~150-200 words)
    const words = generatedText.split(' ');
    if (words.length > count) {
      generatedText = words.slice(0, count).join(' ') + '.';
    }
    
    return generatedText;
  };
  