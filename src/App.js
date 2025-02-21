/* eslint-disable no-restricted-globals */
import { useEffect, useState, useRef } from "react";
import Button from "../src/components/ui/button";
import Select from "../src/components/ui/select";
import Textarea from "../src/components/ui/textarea";

function App() {
  // State declarations
  const [detector, setDetector] = useState(null);
  const [summarizer, setSummarizer] = useState(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState([]);
  const [detectedLang, setDetectedLang] = useState("Detecting...");
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [statusMessage, setStatusMessage] = useState("");
  
  const chatEndRef = useRef(null);
  const languageOptions = {
    en: "English",
    fr: "French",
    ru: "Russian",
    es: "Spanish",
    pt: "Portuguese",
  };

  // AI Initialization
  useEffect(() => {
    const initAI = async () => {
      if (!self.ai?.languageDetector || !self.ai?.translator || !self.ai?.summarizer) {
        setStatusMessage("❌ Error: AI APIs not available.");
        return;
      }
      try {
        const [detectorInstance, summarizerInstance] = await Promise.all([
          self.ai.languageDetector.create(),
          self.ai.summarizer.create(),
        ]);
        setDetector(detectorInstance);
        setSummarizer(summarizerInstance);
        setStatusMessage("✅ AI Services Ready!");
      } catch (err) {
        console.error("Error initializing AI services:", err);
        setStatusMessage("❌ Failed to initialize AI services.");
      }
    };
    initAI();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputText]);

  // Message handling functions
  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newMessage = { 
      id: Date.now(),
      text: inputText,
      type: "sent",
      originalWordCount: inputText.trim().split(/\s+/).filter(word => word).length,
      needsSummarization: inputText.trim().split(/\s+/).filter(word => word).length > 150
    };
    
    setOutputText(prev => [...prev, newMessage]);
    setInputText("");
    setStatusMessage("🔍 Detecting language...");

    try {
      const results = await detector.detect(inputText);
      setDetectedLang(results[0]?.detectedLanguage || "Unknown");
      setStatusMessage("✅ Language detected.");
    } catch (error) {
      console.error("Detection Error:", error);
      setStatusMessage("❌ Language detection failed.");
    }
  };

  // Summarization functions
  const handleSummarizeLast = async () => {
    const lastMessage = outputText[outputText.length - 1];
    if (!lastMessage?.needsSummarization || !summarizer) return;
    
    setStatusMessage("📖 Summarizing...");
    try {
      const summary = await summarizer.summarize(lastMessage.text);
      setOutputText(prev => prev.map(msg => 
        msg.id === lastMessage.id ? { 
          ...msg, 
          summary: summary,
          summarized: true,
          needsSummarization: false,
          summaryLang: msg.lang || detectedLang
        } : msg
      ));
      setStatusMessage("✅ Summarized.");
    } catch (error) {
      console.error("Summarization Error:", error);
      setStatusMessage("❌ Summarization failed.");
    }
  };

  // Translation functions
  const translateText = async () => {
    if (!outputText.length) return;
    const lastMessage = outputText[outputText.length - 1];
    if (lastMessage.lang === selectedLanguage) return;

    if (detectedLang === "Unknown" || !languageOptions[detectedLang]) {
      setStatusMessage("❌ Cannot translate from unknown language.");
      return;
    }

    setStatusMessage("🔄 Translating...");
    try {
      const translatorInstance = await self.ai.translator.create({
        model: "default",
        sourceLanguage: detectedLang,
        targetLanguage: selectedLanguage,
      });
      const translatedText = await translatorInstance.translate(lastMessage.text);
      const newMessage = {
        id: Date.now(),
        text: translatedText,
        type: "received",
        lang: selectedLanguage,
        originalText: lastMessage.text,
        needsSummarization: translatedText.split(/\s+/).length > 150
      };
      setOutputText(prev => [...prev, newMessage]);
      setStatusMessage("✅ Translation success.");
    } catch (error) {
      console.error("Translation Error:", error);
      setStatusMessage("❌ Translation failed.");
    }
  };

  // Utility functions
  const removeMessage = (id) => {
    setOutputText(prev => prev.filter(msg => msg.id !== id));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage("✅ Copied to clipboard!");
    } catch (err) {
      setStatusMessage("❌ Failed to copy text");
    }
  };

  // Render
  return (
    <div className="flex flex-col max-w-4xl mx-auto h-screen p-4 bg-gradient-to-br from-indigo-900 to-purple-800">
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-sm">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h1 className="text-2xl font-bold text-center text-white">AI Language Assistant</h1>
          <div className="flex justify-center gap-4 mt-2">
            <p className="text-sm text-indigo-200">
              Detected: <span className="font-semibold">{detectedLang}</span>
            </p>
            <p className="text-sm text-indigo-200">
              Input Words: <span className="font-semibold">{inputText.trim().split(/\s+/).filter(word => word).length}</span>
            </p>
          </div>
        </div>

        <p className={`text-sm font-bold text-center p-2 ${
          statusMessage.includes("❌") ? "bg-red-100 text-red-700" : 
          statusMessage.includes("✅") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
        }`}>
          {statusMessage}
        </p>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {outputText.map(message => (
            <div key={message.id} className={`relative p-4 max-w-[85%] rounded-2xl break-words shadow-lg ${
              message.summarized ? "bg-amber-50 border-2 border-amber-200" : 
              message.type === "sent" ? "bg-blue-600 text-white ml-auto" : 
              message.lang ? "bg-emerald-50 border-2 border-emerald-200" :
              "bg-white text-gray-800 border-2 border-indigo-100"
            }`}>
              <div className="absolute top-2 right-2 flex gap-1">
                <button 
                  onClick={() => copyToClipboard(message.text)}
                  className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
                  aria-label="Copy message"
                >
                  ⎘
                </button>
                {message.type === "received" && (
                  <button 
                    onClick={() => removeMessage(message.id)}
                    className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    aria-label="Remove message"
                  >
                    ✖
                  </button>
                )}
              </div>
              
              <p className="mb-2">{message.text}</p>
              
              {message.summary && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">{message.summary}</p>
                </div>
              )}
              
              {message.type === "received" && (
                <div className="flex justify-between items-center text-xs mt-3">
                  <span className="text-indigo-600 font-medium">
                    {languageOptions[message.lang]}
                  </span>
                  <button 
                    onClick={() => handleSummarizeLast()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-colors"
                  >
                    Summarize
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t bg-white/90">
          <div className="flex flex-col md:flex-row gap-3 w-full mb-3">
            <Select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full md:w-2/3 bg-white border-2 border-indigo-200 rounded-xl focus:border-indigo-500"
            >
              {Object.entries(languageOptions).map(([key, label]) => (
                <option key={key} value={key} className="text-indigo-900">
                  {label}
                </option>
              ))}
            </Select>
            <Button 
              onClick={translateText}
              className="w-full md:w-1/3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition-colors shadow-md"
            >
              Translate
            </Button>
          </div>

          <div className="relative">
            <Textarea 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              placeholder="Type your message..." 
              className="w-full max-h-32 overflow-y-auto border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 pr-16"
              rows={3}
            />
          </div>
          
          <Button 
            onClick={outputText[outputText.length - 1]?.needsSummarization ? handleSummarizeLast : handleSend}
            className={`w-full mt-3 font-semibold py-3 rounded-xl transition-all shadow-lg ${
              outputText[outputText.length - 1]?.needsSummarization 
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {outputText[outputText.length - 1]?.needsSummarization 
              ? "Summarize Last Message" 
              : "Send Message"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;