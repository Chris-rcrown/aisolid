/* eslint-disable no-restricted-globals */
import { useEffect, useState } from "react";
import Button from "../src/components/ui/button";
import Select from "../src/components/ui/select";
import Textarea from "../src/components/ui/textarea";

function App() {
  const [translator, setTranslator] = useState(null);
  const [detector, setDetector] = useState(null);
  const [summarizer, setSummarizer] = useState(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState([]);
  const [detectedLang, setDetectedLang] = useState("Detecting...");
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [statusMessage, setStatusMessage] = useState("");

  const languageOptions = {
    en: "English",
    fr: "French",
    ru: "Russian",
    es: "Spanish",
    pt: "Portuguese",
  };

  useEffect(() => {
    const initAI = async () => {
      if (!self.ai || !self.ai.languageDetector || !self.ai.translator || !self.ai.summarizer) {
        console.error("AI APIs are not available.");
        setStatusMessage("❌ Error: AI APIs not available.");
        return;
      }
      try {
        const detectorInstance = await self.ai.languageDetector.create();
        setDetector(detectorInstance);
        const summarizerInstance = await self.ai.summarizer.create();
        setSummarizer(summarizerInstance);
        setStatusMessage("✅ AI Services Ready!");
      } catch (err) {
        console.error("Error initializing AI services:", err);
        setStatusMessage("❌ Failed to initialize AI services.");
      }
    };
    initAI();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setOutputText((prev) => [...prev, { text: inputText, type: "sent" }]);
    setInputText("");
    setStatusMessage("🔍 Detecting language...");

    try {
      const results = await detector.detect(inputText);
      setDetectedLang(results[0]?.detectedLanguage || "Unknown");
      setStatusMessage("✅ Language detected successfully.");
    } catch (error) {
      console.error("Language Detection Error:", error);
      setStatusMessage("❌ Error detecting language.");
    }
  };

  const translateText = async () => {
    if (!outputText.length) return;
    const lastMessage = outputText[outputText.length - 1];
    if (lastMessage.lang === selectedLanguage) return;
    setStatusMessage("🔄 Translating text...");

    try {
      const translatorInstance = await self.ai.translator.create({
        model: "default",
        sourceLanguage: detectedLang,
        targetLanguage: selectedLanguage,
      });
      const translatedText = await translatorInstance.translate(lastMessage.text);
      setOutputText((prev) => [...prev, { text: translatedText, type: "received", lang: selectedLanguage }]);
      setStatusMessage("✅ Translation successful.");
    } catch (error) {
      console.error("Translation Error:", error);
      setStatusMessage("❌ Translation failed.");
    }
  };

  const summarizeText = async (text, index) => {
    if (!summarizer) {
      setStatusMessage("❌ Summarizer not initialized yet.");
      return;
    }
    setStatusMessage("📖 Summarizing text...");

    try {
      const summary = await summarizer.summarize(text);
      setOutputText((prev) => prev.map((msg, i) => (i === index ? { ...msg, text: summary, summarized: true } : msg)));
      setStatusMessage("✅ Summarization successful.");
    } catch (error) {
      console.error("Summarization Error:", error);
      setStatusMessage("❌ Summarization failed.");
    }
  };

  const removeTranslation = (index) => {
    setOutputText((prev) => prev.filter((_, i) => i !== index));
  };

  const displayedTextWordCount = outputText.reduce((acc, message) => acc + message.text.split(" ").length, 0);

  return (
    <div className="flex flex-col max-w-4xl mx-auto md:my-[10vh] p-8 border rounded-lg shadow-lg bg-white w-full sm:w-4/5 lg:w-3/4 ">
      <header className="h-[800px] md:h-[900px] border-b p-6 overflow-auto flex flex-col bg-gray-100 rounded-lg">
        <h1 className="text-lg font-bold text-center mb-2">AI Chatbot</h1>
        <p className="text-sm text-gray-600 text-center">Detected Language: {detectedLang}</p>
        <p className="text-sm font-bold text-white text-center p-2 rounded-md bg-purple-600">{statusMessage}</p>
        <div className="flex flex-col gap-3 p-3 overflow-auto h-full">
          {outputText.map((message, index) => (
            <div key={index} className={`relative p-4 max-w-lg rounded-lg break-words ${message.summarized ? "bg-yellow-200" : message.type === "sent" ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-black self-start"}`}>
              {message.type === "received" && (
                <div className="absolute top-1 right-1">
                  <button onClick={() => removeTranslation(index)} className="text-red-500 text-sm">✖</button>
                </div>
              )}
              {message.text}
              {message.type === "received" && (
                <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                  <span>{languageOptions[message.lang]}</span>
                  {message.text.split(" ").length > 150 && (
                    <button className="text-blue-500 ml-2" onClick={() => summarizeText(message.text, index)}>Summarize</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </header>
      <div className="flex flex-col md:flex-row gap-3 my-3 w-full">
        <Select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full md:w-2/3">
          {Object.entries(languageOptions).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
        <Button onClick={translateText} className="w-full md:w-1/3">Translate</Button>
      </div>
      <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type your message..." className="w-full" />
      <Button onClick={handleSend} className="w-full mt-3">{displayedTextWordCount > 150 ? "Summarize" : "Send"}</Button>
    </div>
  );
}

export default App;
