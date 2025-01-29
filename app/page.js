'use client'

import { useState, useEffect } from 'react';
import { Box, Button, Stack, TextField, Typography, CircularProgress } from '@mui/material';

const translations = {
  en: {
    header: "Chat with Your Workout Assistant",
    selectLanguage: "Select Language:",
    placeholder: "Ask your question...",
    sendButton: "Send",
    error: "I'm sorry, but I encountered an error. Please try again later.",
    dislikeButton: "Dislike",
    intro: "Hey, how can I help with your fitness goals?",
  },
  fr: {
    header: "Discutez avec votre assistant d'entraînement",
    selectLanguage: "Choisissez la langue :",
    placeholder: "Posez votre question...",
    sendButton: "Envoyer",
    error: "Je suis désolé, mais j'ai rencontré une erreur. Veuillez réessayer plus tard.",
    dislikeButton: "Je n'aime pas",
    intro: "Hé, comment puis-je vous aider dans vos objectifs de remise en forme ?",
  },
  es: {
    header: "Chatea con tu asistente de entrenamiento",
    selectLanguage: "Selecciona el idioma:",
    placeholder: "Haz tu pregunta...",
    sendButton: "Enviar",
    error: "Lo siento, pero encontré un error. Por favor, inténtalo de nuevo más tarde.",
    dislikeButton: "No me gusta",
    intro: "Oye, ¿cómo puedo ayudarte con tus metas de fitness?",
  }
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [regenerateIndex, setRegenerateIndex] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: translations[language].intro }
    ]);
  }, [language]);

  const sendMessage = async (regenerate = false) => {
    const messageToSend = regenerate
      ? getMessages().find((_, index) => index === regenerateIndex)?.content
      : message;

    if (!messageToSend?.trim()) return;

    const newMessages = [...getMessages()];
    if (regenerate) {
      newMessages[messages.length - 1] = { ...newMessages[regenerateIndex], content: '' };
    } else {
      newMessages.push({ role: 'user', content: messageToSend });
      newMessages.push({ role: 'assistant', content: '' });
    }

    updateMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, regenerate, language }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let newContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        newContent += text.replace(/###\s*|\*\*.*?\*\*|\*\*/g, '');

        updateMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          if (regenerate) {
            updatedMessages[updatedMessages.length - 1] = { ...updatedMessages[regenerateIndex], content: newContent };
          } else {
            updatedMessages[updatedMessages.length - 1] = { role: 'assistant', content: newContent };
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      updateMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: translations[language].error },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = (index) => {
    setRegenerateIndex(index);
    setIsRegenerating(true);
    sendMessage(true);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      if (isRegenerating) {
        setIsRegenerating(false);
      }
      sendMessage();
      setMessage('');
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  const getMessages = () => {
    switch (language) {
      case 'fr': return messages;
      case 'es': return messages;
      default: return messages;
    }
  };

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#2C3E50" // Dark gym-like background
      p={3}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        p={2}
      >
        <Box
          component="img"
          src="/olympics.png"
          alt="Olympics"
          sx={{
            maxWidth: { xs: '100px', sm: '150px', md: '200px' },
            maxHeight: { xs: '100px', sm: '150px', md: '200px' },
            width: 'auto',
            height: 'auto',
          }}
        />
      </Box>
      <Stack
        direction="column"
        width={{ xs: '95vw', sm: '85vw', md: '70vw' }}
        height="80vh"
        borderRadius={3}
        boxShadow={6}
        overflow="hidden"
        bgcolor="#34495E" // Dark gray-blue background for chat container
      >
        {/* Header Section */}
        <Box
          bgcolor="#E74C3C" // Red accent
          p={2}
          borderBottom="1px solid #ccc"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="h5" fontWeight="bold" color="white">
            {translations[language].header}
          </Typography>
        </Box>

        {/* Language Selector */}
        <Box p={2} bgcolor="#2C3E50" borderBottom="1px solid #ccc">
          <Typography variant="body1" fontWeight="bold" color="white">{translations[language].selectLanguage}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant={language === 'en' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('en')}
              sx={{ bgcolor: language === 'en' ? '#FCB131' : 'transparent', color: language === 'en' ? 'black' : '#FCB131' }}
            >
              English
            </Button>
            <Button
              variant={language === 'fr' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('fr')}
              sx={{ bgcolor: language === 'fr' ? '#FCB131' : 'transparent', color: language === 'fr' ? 'black' : '#FCB131' }}
            >
              French
            </Button>
            <Button
              variant={language === 'es' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('es')}
              sx={{ bgcolor: language === 'es' ? '#FCB131' : 'transparent', color: language === 'es' ? 'black' : '#FCB131' }}
            >
              Spanish
            </Button>
          </Stack>
        </Box>

        {/* Messages Section */}
        <Stack
          direction="column"
          flexGrow={1}
          overflow="auto"
          p={2}
          bgcolor="#34495E" // Darker gray for message area
        >
          {getMessages().map((msg, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems={msg.role === 'assistant' ? 'flex-start' : 'flex-end'}
              p={1}
            >
              <Box
                bgcolor={msg.role === 'assistant' ? '#1ABC9C' : '#E67E22'} // Gym-like colors: teal for assistant, orange for user
                color="white"
                borderRadius={6}
                p={2}
                maxWidth="80%"
                sx={{ wordBreak: 'break-word' }}
              >
                {msg.content}
              </Box>
              {msg.role === 'assistant' && index === getMessages().length - 1 && (
                <Box mt={1} display="flex" justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => handleDislike(index)}
                    sx={{
                      borderColor: '#FCB131',
                      color: '#FCB131',
                      '&:hover': {
                        borderColor: '#f9a825',
                        color: '#f9a825',
                      },
                    }}
                  >
                    {translations[language].dislikeButton}
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
        
        {/* Input Section */}
        <Stack direction="row" spacing={1} p={1} alignItems="center">
          <TextField
            label={translations[language].placeholder}
            fullWidth
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
    '& .MuiInputLabel-root': {
      color: 'white',
    },
    '& .MuiOutlinedInput-root': {
      color: 'white', // Set the text color to white
      '& input': {
        color: 'white', // Ensure the input text itself is white
      },
    },
  }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            disabled={loading}
            sx={{ bgcolor: '#FCB131' }} // Bright gym-themed yellow
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : translations[language].sendButton}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
