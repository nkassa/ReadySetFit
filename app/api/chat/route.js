import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractTextFromPDF(pdfPath) {
  const fileBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(fileBuffer);
  return pdfData.text;
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { pdfPath = 'fitness-handbook.pdf', language = 'en' } = data;

    const resolvedPdfPath = path.join(process.cwd(), 'data', pdfPath);
    const pdfText = await extractTextFromPDF(resolvedPdfPath);

    const workoutPrompt = `Based on the content of the following fitness handbook, create a personalized workout plan: ${pdfText}`;

    const systemPrompts = {
      en: workoutPrompt,
      fr: workoutPrompt,
      es: workoutPrompt,
    };

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

    return new NextResponse(stream);
  } catch (err) {
    console.error('Error handling request:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
