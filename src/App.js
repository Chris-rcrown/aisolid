/* eslint-disable no-restricted-globals */
import { useState, useEffect, useRef } from "react";
import Button from "../src/components/ui/button";
import Select from "../src/components/ui/select";
import Textarea from "../src/components/ui/textarea";

function App() {
  const [detector, setDetector] = useState(null);
  const [summarizer, setSummarizer] = useState(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState([]);
  const [detectedLang, setDetectedLang] = useState("Detecting...");
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [statusMessage, setStatusMessage] = useState("");
  const [detectionConfidence, setDetectionConfidence] = useState(null);

  const chatEndRef = useRef(null);
  const languageOptions = {
    en: "English",
    fr: "French",
    ru: "Russian",
    es: "Spanish",
    pt: "Portuguese",
  };

  // Initialize AI services
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

  // Scroll to the end of the chat when outputText updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputText]);

  // Handle sending a message (detects language and stores original input)
  const handleSend = async () => {
    if (!inputText.trim()) return;
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length; // Accurate word count
    const newMessage = {
      id: Date.now(),
      text: inputText,
      type: "sent",
      originalWordCount: words,
      needsSummarization: words > 150,
    };
    setOutputText((prev) => [...prev, newMessage]);
    setInputText("");
    setStatusMessage("🔍 Detecting language...");
    try {
      const results = await detector.detect(inputText);
      const detectedLanguage = results[0]?.detectedLanguage || "Unknown";
      const confidence = results[0]?.confidence || 0;
      setDetectedLang(detectedLanguage);
      setDetectionConfidence(confidence);
      setStatusMessage("✅ Language detected.");
    } catch (error) {
      console.error("Detection Error:", error);
      setStatusMessage("❌ Language detection failed.");
    }
  };

  // Summarize the displayed input text (original text before translation)
  const summarizeOriginalText = async () => {
    const lastMessage = outputText[outputText.length - 1];
    if (!lastMessage?.needsSummarization || !summarizer) return;
    setStatusMessage("📖 Summarizing original text...");
    try {
      const summary = await summarizer.summarize(lastMessage.text, {
        sourceLanguage: detectedLang,  // Use detected language as source
        targetLanguage: selectedLanguage,  // Use selected language as target
      });
      setOutputText((prev) =>
        prev.map((msg) =>
          msg.id === lastMessage.id
            ? { ...msg, summary, summarized: true, needsSummarization: false, summaryLang: selectedLanguage }
            : msg
        )
      );
      setStatusMessage("✅ Original text summarized.");
    } catch (error) {
      console.error("Summarization Error:", error);
      setStatusMessage("❌ Summarization of original text failed.");
    }
  };

  // Handle translating the last message
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
      // Ensure self.ai.translator exists and is accessible
      if (!self.ai?.translator) {
        throw new Error("Translation service unavailable");
      }

      // Create translator instance with explicit language checks
      const translatorInstance = await self.ai.translator.create({
        model: "default",
        sourceLanguage: detectedLang,  // Ensure this matches the detected language
        targetLanguage: selectedLanguage,  // Ensure this matches the selected language (e.g., "es" for Spanish)
      });

      // Perform translation and verify the result
      const translatedText = await translatorInstance.translate(lastMessage.text);
      if (!translatedText || translatedText.trim() === "") {
        throw new Error("Translation returned empty or invalid result");
      }

      const newMessage = {
        id: Date.now(),
        text: translatedText,
        type: "received",
        lang: selectedLanguage,
        originalText: lastMessage.text,
        needsSummarization: translatedText.split(/\s+/).filter(word => word.length > 0).length > 150,
      };
      setOutputText((prev) => [...prev, newMessage]);
      setStatusMessage("✅ Translation success.");
    } catch (error) {
      console.error("Translation Error:", error);
      setStatusMessage(`❌ Translation failed: ${error.message || "Unknown error"}`);
    }
  };

  // Summarize the translated text, using its lang as both source and target language
  const summarizeTranslatedText = async (text, lang) => {
    if (!summarizer) return;
    setStatusMessage("📖 Summarizing translated text...");
    try {
      // Ensure the target language is explicitly set and validated
      if (!languageOptions[lang]) {
        throw new Error(`Unsupported language for summarization: ${lang}`);
      }

      // Log the input and target language for debugging
      console.log(`Summarizing translated text in language: ${lang}`, { text, sourceLanguage: lang, targetLanguage: lang });

      // Use the summarizer with the translated text’s language as both source and target
      const summary = await summarizer.summarize(text, {
        sourceLanguage: lang,  // Use the translated language as the source
        targetLanguage: lang,  // Use the same language as the target to maintain it
        forceLanguage: true,  // Hypothetical option to enforce language (adjust if your API doesn’t support this)
      });

      // Validate the summary language (optional, if your summarizer provides language metadata)
      if (!summary || summary.trim() === "") {
        throw new Error("Summarization returned empty or invalid result");
      }

      setOutputText((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: summary,
          type: "summarized",
          lang: lang,  // Maintain the translated language
          summaryLang: lang,  // Ensure the summary language matches the translated language
          summarized: true,
        },
      ]);
      setStatusMessage("✅ Translated text summarized.");
    } catch (error) {
      console.error("Translated Summarization Error:", error);
      setStatusMessage(`❌ Summarization of translated text failed: ${error.message || "Unknown error"}`);
    }
  };

  // Remove a message
  const removeMessage = (id) => {
    setOutputText((prev) => prev.filter((msg) => msg.id !== id));
  };

  // Copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage("✅ Copied to clipboard!");
    } catch (err) {
      setStatusMessage("❌ Failed to copy text");
    }
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto h-screen p-4 bg-gradient-to-br from-indigo-900 to-purple-800">
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h1 className="text-2xl font-bold text-center text-white">AI Language Assistant</h1>
          <div className="flex justify-between mt-2 text-sm text-indigo-200">
            <span>
              Confidence: {detectionConfidence !== null ? `${detectionConfidence}% ` : "N/A "} | Detected:{" "}
              <span className="font-semibold">{detectedLang}</span>
            </span>
            <span>Input Words: <span className="font-semibold">{inputText.trim().split(/\s+/).filter(word => word.length > 0).length}</span></span>
          </div>
        </div>

        {/* Status Message */}
        <p
          className={`text-sm font-bold text-center p-2 ${
            statusMessage.includes("❌")
              ? "bg-red-100 text-red-700"
              : statusMessage.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {statusMessage}
        </p>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {outputText.map((message) => (
            <div
              key={message.id}
              className={`relative p-4 max-w-[85%] rounded-2xl break-words shadow-lg ${
                message.type === "sent"
                  ? "ml-auto bg-blue-600 text-white"
                  : message.type === "received"
                  ? "bg-emerald-50 border-2 border-emerald-200 ml-0"
                  : "bg-amber-50 border-2 border-amber-200 ml-0"
              }`}
            >
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => copyToClipboard(message.text)}
                  className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
                  aria-label="Copy message"
                >
                  ⎘
                </button>
                <button
                  onClick={() => removeMessage(message.id)}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  aria-label="Remove message"
                >
                  ✖
                </button>
              </div>

              <p className="mb-2">{message.text}</p>

              {message.type === "received" && (
                <div className="flex justify-between items-center text-xs mt-3">
                  <span className="text-indigo-600 font-medium">
                    {languageOptions[message.lang]}
                  </span>
                  <button
                    onClick={() => summarizeTranslatedText(message.text, message.lang)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-colors"
                  >
                    Summarize Translated
                  </button>
                </div>
              )}

              {message.summary && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">{message.summary}</p>
                  <div className="flex justify-between items-center text-xs mt-2">
                    <span className="text-purple-500">
                      {languageOptions[message.summaryLang]} Summary
                    </span>
                    <button
                      onClick={() => copyToClipboard(message.summary)}
                      className="text-blue-500 hover:text-blue-600 text-xs"
                    >
                      Copy Summary
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
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
            onClick={
              outputText[outputText.length - 1]?.needsSummarization
                ? summarizeOriginalText
                : handleSend
            }
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