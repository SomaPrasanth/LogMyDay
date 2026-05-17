import RNFS from 'react-native-fs';

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const transcribeAudio = async (apiKey, audioFilePath) => {
  try {
    // 1. Whisper Transcription
    const formData = new FormData();
    formData.append('file', {
      uri: `file://${audioFilePath}`,
      name: 'audio.m4a',
      type: 'audio/m4a',
    });
    formData.append('model', 'whisper-large-v3');

    const whisperResponse = await fetch(GROQ_WHISPER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Groq Whisper Error:', errorText);
      throw new Error(`Whisper Error (${whisperResponse.status}): ${errorText}`);
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text;

    if (!transcript) {
      throw new Error('Whisper returned an empty transcript.');
    }

    // 2. Llama 3 Summarization
    const chatResponse = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a summarization assistant.' },
          { role: 'user', content: `Read this diary transcript and return only a 1-sentence summary of the main event or feeling:\n\n${transcript}` }
        ]
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Groq Llama 3 Error:', errorText);
      throw new Error(`Summary Error (${chatResponse.status}): ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const summary = chatData.choices[0]?.message?.content?.trim() || '';

    return {
      transcript: transcript,
      daily_summary: summary,
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};
