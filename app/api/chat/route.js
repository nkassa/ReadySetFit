import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI API client (ensure you have your API key set)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to read and parse the fitness file
const readFitnessFile = async () => {
  try {
    const filePath = path.join(process.cwd(), 'fitness_data.txt'); // Path to your fitness file
    const data = fs.readFileSync(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('Error reading the fitness file:', error);
    return null;
  }
};

// Chatbot response generation based on fitness file content
const generateResponse = async (fitnessData, userPrompt) => {
  try {
    const prompt = `${fitnessData}\n\nUser's query: ${userPrompt}\nResponse:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // or another model if needed
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Sorry, I couldn’t process your request.';
  }
};

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    
    // Read the fitness data
    const fitnessData = await readFitnessFile();
    if (!fitnessData) {
      return NextResponse.json({ error: 'Fitness file not found or could not be read.' }, { status: 500 });
    }

    // Generate the response based on the fitness data and user prompt
    const response = await generateResponse(fitnessData, prompt);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error handling the request:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
