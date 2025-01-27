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
  }
};

export default function Home() {
  const [messagesEn, setMessagesEn] = useState([{ role: 'assistant', content: translations.en.intro }]);
  const [messagesFr, setMessagesFr] = useState([{ role: 'assistant', content: translations.fr.intro }]);
  const [messagesEs, setMessagesEs] = useState([{ role: 'assistant', content: translations.es.intro }]);
  const [message, setMessage] = useState('');
  const [regenerateIndex, setRegenerateIndex] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [language, setLanguage] = useState('en');

  const getMessages = () => {
    switch (language) {
      case 'fr': return messagesFr;
      case 'es': return messagesEs;
      default: return messagesEn;
    }
  };

  const updateMessages = (newMessages) => {
    switch (language) {
      case 'fr': setMessagesFr(newMessages); break;
      case 'es': setMessagesEs(newMessages); break;
      default: setMessagesEn(newMessages); break;
    }
  };

  const sendMessage = async (regenerate = false) => {
    const messageToSend = regenerate
      ? getMessages()[regenerateIndex]?.content
      : message;

    if (!messageToSend.trim()) return;

    const newMessages = [...getMessages(), { role: 'user', content: messageToSend }];
    if (!regenerate) newMessages.push({ role: 'assistant', content: '' });
    updateMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, language }),
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      const updatedMessages = [...newMessages];
      updatedMessages[updatedMessages.length - 1].content = data.reply || translations[language].error;
      updateMessages(updatedMessages);
    } catch {
      const errorMessages = [...newMessages, { role: 'assistant', content: translations[language].error }];
      updateMessages(errorMessages);
    }
  };

  const handleLanguageChange = (lang) => setLanguage(lang);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      bgcolor="#003366"
      p={2}
    >
      <Box display="flex" justifyContent="center" p={2}>
        <Box
          component="img"
          src="/olympics.png"
          alt="Olympics"
          sx={{ maxWidth: '150px', maxHeight: '150px' }}
        />
      </Box>
      <Stack
        direction="column"
        width={{ xs: '95%', md: '70%' }}
        margin="auto"
        height="80vh"
        bgcolor="white"
        borderRadius={4}
        boxShadow={5}
        overflow="hidden"
      >
        <Box bgcolor="#EE334E" color="white" p={2} textAlign="center">
          <Typography variant="h5">{translations[language].header}</Typography>
        </Box>
        <Box p={2} bgcolor="#f9f9f9">
          <Typography>{translations[language].selectLanguage}</Typography>
          <Stack direction="row" spacing={1} mt={1}>
            {['en', 'fr', 'es'].map((lang) => (
              <Button
                key={lang}
                variant={language === lang ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => handleLanguageChange(lang)}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </Stack>
        </Box>
        <Stack flexGrow={1} overflow="auto" p={2} bgcolor="#fafafa">
          {getMessages().map((msg, index) => (
            <Box
              key={index}
              alignSelf={msg.role === 'assistant' ? 'flex-start' : 'flex-end'}
              bgcolor={msg.role === 'assistant' ? '#008080' : '#333'}
              color="white"
              borderRadius={4}
              p={2}
              m={1}
              maxWidth="75%"
            >
              {msg.content}
            </Box>
          ))}
        </Stack>
        <Stack direction="row" p={2} bgcolor="#f9f9f9">
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder={translations[language].placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => sendMessage()}
            sx={{ ml: 1 }}
          >
            {translations[language].sendButton}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
