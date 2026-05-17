import RNFS from 'react-native-fs';

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const transcribeAudio = async (apiKey, audioFilePath, spokenLanguage = 'en', outputLanguage = 'English') => {
  try {
    // 1. Whisper Transcription
    const formData = new FormData();
    formData.append('file', {
      uri: `file://${audioFilePath}`,
      name: 'audio.m4a',
      type: 'audio/m4a',
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', spokenLanguage);

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

    // 2. Llama 3 Summarization & Translation
    const prompt = `You are a diary assistant.
Here is a raw transcript spoken in ${spokenLanguage}.
The user wants their diary saved in ${outputLanguage}.

Please return a strictly formatted JSON object with exactly two keys:
1. "transcript": Translate the full transcript into ${outputLanguage}.
2. "summary": A 1-sentence summary of the diary entry, written in ${outputLanguage}.

Raw Transcript: "${transcript}"`;

    const chatResponse = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Groq Llama 3 Error:', errorText);
      throw new Error(`Summary Error (${chatResponse.status}): ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const resultText = chatData.choices[0]?.message?.content?.trim() || '{}';
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      console.error('Failed to parse JSON from Llama:', resultText);
      parsedResult = { transcript: transcript, summary: 'Translation failed.' };
    }

    return {
      transcript: parsedResult.transcript || transcript,
      daily_summary: parsedResult.summary || '',
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};
