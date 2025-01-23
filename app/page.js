'use client';

import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

const translations = {
  en: {
    header: "Chat with Olympics Assistant",
    selectLanguage: "Select Language:",
    placeholder: "Ask your question...",
    sendButton: "Send",
    error: "I'm sorry, but I encountered an error. Please try again later.",
    dislikeButton: "Dislike",
    intro: "Hey, how can I help? ",
  },
  fr: {
    header: "Discutez avec l'assistant des Jeux Olympiques",
    selectLanguage: "Choisissez la langue :",
    placeholder: "Posez votre question...",
    sendButton: "Envoyer",
    error: "Je suis désolé, mais j'ai rencontré une erreur. Veuillez réessayer plus tard.",
    dislikeButton: "Je n'aime pas",
    intro: "Hé, comment puis-je aider ?",
  },
  es: {
    header: "Chatea con el asistente de los Juegos Olímpicos",
    selectLanguage: "Selecciona el idioma:",
    placeholder: "Haz tu pregunta...",
    sendButton: "Enviar",
    error: "Lo siento, pero encontré un error. Por favor, inténtalo de nuevo más tarde.",
    dislikeButton: "No me gusta",
    intro: "Oye, ¿cómo puedo ayudar?",
  },
};

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: translations.en.intro },
  ]);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSendMessage = async (regenerate = false, index = null) => {
    const messageToSend = regenerate
      ? messages[index]?.content || ''
      : message;

    if (!messageToSend.trim()) return;

    const updatedMessages = [...messages];

    if (regenerate && index !== null) {
      updatedMessages[index] = { ...updatedMessages[index], content: '' };
    } else {
      updatedMessages.push({ role: 'user', content: messageToSend });
      updatedMessages.push({ role: 'assistant', content: '' });
    }

    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          regenerate,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Network error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let newContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        newContent += decoder.decode(value, { stream: true });

        setMessages((prevMessages) => {
          const tempMessages = [...prevMessages];
          if (regenerate && index !== null) {
            tempMessages[index] = {
              ...tempMessages[index],
              content: newContent,
            };
          } else {
            tempMessages[tempMessages.length - 1] = {
              role: 'assistant',
              content: newContent,
            };
          }
          return tempMessages;
        });
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: translations[language].error },
      ]);
    } finally {
      setIsRegenerating(false);
      setMessage('');
    }
  };

  const handleDislike = (index) => {
    setIsRegenerating(true);
    handleSendMessage(true, index);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setMessages([{ role: 'assistant', content: translations[lang].intro }]);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#0081C8"
      p={3}
    >
      <Box display="flex" justifyContent="center" p={2}>
        <Box
          component="img"
          src="/olympics.png"
          alt="Olympics"
          sx={{ maxWidth: '200px', maxHeight: '200px', width: 'auto', height: 'auto' }}
        />
      </Box>
      <Stack
        direction="column"
        width="70vw"
        height="80vh"
        borderRadius={3}
        boxShadow={6}
        bgcolor="white"
      >
        <Box bgcolor="#EE334E" p={2}>
          <Typography variant="h5" fontWeight="bold" color="#fff">
            {translations[language].header}
          </Typography>
        </Box>
        <Box p={2} bgcolor="#f5f5f5">
          <Typography variant="body1" fontWeight="bold">{translations[language].selectLanguage}</Typography>
          <Stack direction="row" spacing={1}>
            {['en', 'fr', 'es'].map((lang) => (
              <Button
                key={lang}
                variant={language === lang ? 'contained' : 'outlined'}
                onClick={() => handleLanguageChange(lang)}
                sx={{
                  bgcolor: language === lang ? '#FCB131' : 'transparent',
                  color: language === lang ? 'black' : '#FCB131',
                }}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </Stack>
        </Box>
        <Stack flexGrow={1} p={2} overflow="auto" bgcolor="#fafafa">
          {messages.map((msg, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems={msg.role === 'assistant' ? 'flex-start' : 'flex-end'}
              p={1}
            >
              <Box
                bgcolor={msg.role === 'assistant' ? '#009147' : '#37ad70'}
                color="white"
                borderRadius={6}
                p={2}
              >
                {msg.content}
              </Box>
              {msg.role === 'assistant' && index === messages.length - 1 && (
                <Button
                  variant="outlined"
                  onClick={() => handleDislike(index)}
                  sx={{ mt: 1, borderColor: '#FCB131', color: '#FCB131' }}
                >
                  {translations[language].dislikeButton}
                </Button>
              )}
            </Box>
          ))}
        </Stack>
        <Stack direction="row" p={1}>
          <TextField
            fullWidth
            label={translations[language].placeholder}
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleSendMessage()}
            sx={{ bgcolor: '#FCB131', color: 'black', ml: 1 }}
          >
            {translations[language].sendButton}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
