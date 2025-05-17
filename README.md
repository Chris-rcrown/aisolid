# 💬 AI ChatBox

A simple and responsive AI-powered chatbox built with **React**, **Vite**, and modern UI components. It supports:
- Language detection 🌍
- Text summarization 🧠
- Language translation 🌐

> This project is built with scalability in mind and is ready for API integration via Chrome AI endpoints.

---

## 🚀 Features

- 🔍 Detects language from user input
- 📝 Summarizes long messages
- 🌐 Translates text into multiple languages
- ⚡ Built with Vite for lightning-fast performance
- 🎨 Beautiful UI with reusable components

---

## 🛠️ Tech Stack

- **React** (Frontend Library)
- **Vite** (Build Tool)
- **TailwindCSS** (Styling)
- **Chrome AI API** (Language Detection, Summarization, Translation)

---

## 📁 Project Structure

```bash
src/
│
├── components/
│   └── ui/                  # Reusable UI components (Button, Textarea, Select)
│
├── App.jsx                  # App root component
├── ChatBox.jsx              # Chat functionality
├── index.css                # Global styles
├── main.jsx                 # Entry point
└── vite.config.js           # Vite configuration
```

---

## ⚙️ Setup & Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ai-chatbox.git
cd ai-chatbox
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```bash
touch .env
```

Then add your keys:
```
VITE_API_KEY=your_api_key_here
VITE_BASE_URL=https://api.chrome.ai
```

4. **Run the app**
```bash
npm run dev
```

---

## 📸 Screenshots

![ChatBox Screenshot](./screenshots/chatbox-ui.png)

---

## 🧪 API Endpoints Used

- **Detect Language:** `POST https://api.chrome.ai/language-detection`
- **Summarize Text:** `POST https://api.chrome.ai/summarizer`
- **Translate Text:** `POST https://api.chrome.ai/translator`

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙌 Acknowledgments

- [Vite](https://vitejs.dev)
- [React](https://react.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Chrome AI](https://chrome.ai)
