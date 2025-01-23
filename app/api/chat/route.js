import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import tiktoken from 'tiktoken';

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to extract text from a .txt file
async function extractTextFromFile(filePath) {
  return fs.promises.readFile(filePath, 'utf-8');
}

// Function to count tokens using OpenAI's tokenizer
function countTokens(text) {
  const encoding = new tiktoken.TiktokenEncoding('gpt-4'); // Adjust based on the tokenizer version
  return encoding.encode(text).length;
}

// Function to chunk text based on token count
function chunkText(text, maxTokens = 3000) {
  const encoding = new tiktoken.TiktokenEncoding('gpt-4'); // Adjust based on the tokenizer version
  const tokens = encoding.encode(text);
  let chunks = [];
  let currentChunk = [];
  let currentTokenCount = 0;

  for (let token of tokens) {
    currentTokenCount++;

    if (currentTokenCount > maxTokens) {
      chunks.push(encoding.decode(currentChunk));
      currentChunk = [token];
      currentTokenCount = 1;
    } else {
      currentChunk.push(token);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(encoding.decode(currentChunk));
  }

  return chunks;
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { txtPath = 'fitness-handbook.txt', language = 'en' } = data;

    const resolvedTxtPath = path.join(process.cwd(), 'data', txtPath);

    if (!fs.existsSync(resolvedTxtPath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const txtText = await extractTextFromFile(resolvedTxtPath);
    const textChunks = chunkText(txtText); // Use chunkText to avoid exceeding token limits

    const systemPrompts = {
      en: `Based on the content of the following fitness handbook, create a personalized workout plan: ${txtText}`,
      fr: `Based on the content of the following fitness handbook, create a personalized workout plan: ${txtText}`,
      es: `Based on the content of the following fitness handbook, create a personalized workout plan: ${txtText}`,
    };

    const responses = [];

    for (const chunk of textChunks) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'system', content: systemPrompts[language] }],
        stream: true,
      });

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                const cleanedContent = content.replace(/###\s*|\*\*.*?\*\*/g, '');
                const text = encoder.encode(cleanedContent);
                controller.enqueue(text);
              }
            }
          } catch (err) {
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      responses.push(stream);
    }

    return new NextResponse(responses);
  } catch (err) {
    console.error('Error handling request:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
