import { dbConfig } from "@/dbConfig/dbConfig";
import { generateTypingText } from "@/utils/serverUtils";
import { NextRequest, NextResponse } from "next/server";

dbConfig.connect();
export async function POST(req: NextRequest) {
  console.log('into generate-words');
  const reqBody = await req.json();
  const count = reqBody?.count;
  let noOfWords: number = 200;
  if (count != null && !isNaN(Number(count))) {
    noOfWords = Number(count);
  }

  const words = generateTypingText(noOfWords);

  return NextResponse.json({ words });
  
}