import { useEffect, useState } from "react";
import { Button, Select, Textarea } from "@/components/ui";
import "./App.css";

function App() {
  const [summarizerInstance, setSummarizerInstance] = useState(null);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if ("ai" in window) {
      console.log("AI APIs detected");
    } else {
      console.error("AI APIs NOT available");
    }
  }, []);

  // Initialize Summarizer
  useEffect(() => {
    const initSummarizer = async () => {
      try {
        const capabilities = await window.ai.summarizer.capabilities();
        if (capabilities.available !== "yes") return;
        const summarizer = await window.ai.summarizer.create();
        setSummarizerInstance(summarizer);
      } catch (error) {
        console.error("Summarizer Error:", error);
      }
    };
    initSummarizer();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage = { text: inputText, detectedLang: "Detecting...", summary: null, translation: null };
    setMessages([...messages, newMessage]);
    setInputText("");

    // Detect Language
    try {
      const detector = await window.ai.languageDetector.create();
      const results = await detector.detect(inputText);
      newMessage.detectedLang = results[0]?.detectedLanguage || "Unknown";
      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error("Language Detection Error:", error);
    }
  };

  const summarizeText = async (text, index) => {
    if (!summarizerInstance) return;
    try {
      await summarizerInstance.ready;
      const summary = await summarizerInstance.summarize(text);
      const updatedMessages = [...messages];
      updatedMessages[index].summary = summary;
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Summarization Error:", error);
    }
  };

  const translateText = async (text, lang, index) => {
    try {
      const translator = await window.ai.translator.create({ sourceLanguage: "auto", targetLanguage: lang });
      const translatedText = await translator.translate(text);
      const updatedMessages = [...messages];
      updatedMessages[index].translation = translatedText;
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Translation Error:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Chatbot</h1>
        <div className="chat-container">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <p>{msg.text}</p>
              <p className="text-sm text-gray-600">Language: {msg.detectedLang}</p>
              {msg.text.length > 150 && <Button onClick={() => summarizeText(msg.text, index)}>Summarize</Button>}
              <Select onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </Select>
              <Button onClick={() => translateText(msg.text, language, index)}>Translate</Button>
              {msg.summary && <p>Summary: {msg.summary}</p>}
              {msg.translation && <p>Translation: {msg.translation}</p>}
            </div>
          ))}
        </div>
        <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type your message..." />
        <Button onClick={handleSend}>Send</Button>
      </header>
    </div>
  );
}

export default App;
