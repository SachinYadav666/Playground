"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Menu, Paperclip, Image, Settings, Search, Sun, Moon } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ChatPage() {
  const [chats, setChats] = useState<{ id: number; title: string; messages: { text: string; type: "user" | "bot"; imageUrl?: string }[] }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<"NormalSearch" | "ImageSearch" | "WebSearch" | "FileUpload">("NormalSearch");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [fileRefreshId, setFileRefreshId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const BASE_URL="http://127.0.0.1:8000/playground/chat/"
  const BASE_URL_DEPLOYED="https://playground-1-vec8.onrender.com/playground/chat/"
  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const currentChat = chats.find((chat) => chat.id === currentChatId) || { messages: [] };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Generate a new refresh_id for this file session
    const refreshId = "file-" + Date.now();
    
    // Create a new chat if none exists
    const newChatId = currentChatId ?? chats.length + 1;
    if (currentChatId === null) {
      setCurrentChatId(newChatId);
    }

    // Upload the file first
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", "FileUpload");
    formData.append("refresh_id", refreshId);
    formData.append("question", "what this file about");

    try {
      const response = await fetch(BASE_URL_DEPLOYED, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.answer) {
  setFileRefreshId(refreshId);
  setMode("FileUpload");

  setChats(prevChats => {
    const updatedChats = [...prevChats];
    const chatIndex = updatedChats.findIndex(chat => chat.id === newChatId);

    if (chatIndex === -1) {
      updatedChats.unshift({
        id: newChatId,
        title: `File: ${file.name}`,
        messages: [
          { text: data.answer, type: "bot" }
        ]
      });
    } else {
      updatedChats[chatIndex].messages.push(
        { text: data.answer, type: "bot" }
      );
    }

    return updatedChats;
  });

  
  toast.success("File uploaded successfully!");
}

    } catch (error) {
      console.error("Error uploading file:", error);
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(chat => chat.id === newChatId);
        
        if (chatIndex === -1) {
          // Create new chat with error message
          updatedChats.unshift({
            id: newChatId,
            title: `File: ${file.name}`,
            messages: [
              { text: "Error uploading file. Please try again.", type: "bot" }
            ]
          });
        } else {
          // Add error message to existing chat
          updatedChats[chatIndex].messages.push(
            { text: "Error uploading file. Please try again.", type: "bot" }
          );
        }
        
        return updatedChats;
      });
    }
  };

  const handleImageSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the image for later use
    setUploadedImage(file);
    setMode("ImageSearch");

    // Create a new chat if none exists
    const newChatId = currentChatId ?? chats.length + 1;
    if (currentChatId === null) {
      setCurrentChatId(newChatId);
    }

    // Add the image upload message first
    setChats(prevChats => {
      const updatedChats = [...prevChats];
      const chatIndex = updatedChats.findIndex(chat => chat.id === newChatId);
      const newMessage = { 
        text: "Image uploaded. Please type your question about this image.", 
        type: "bot" as const,
        imageUrl: URL.createObjectURL(file)
      };
      
      if (chatIndex === -1) {
        // Create new chat
        updatedChats.unshift({
          id: newChatId,
          title: "Image Analysis",
          messages: [newMessage]
        });
      } else {
        // Add to existing chat
        updatedChats[chatIndex].messages.push(newMessage);
      }
      
      return updatedChats;
    });
  };

  const handleSend = async () => {
  if (!input.trim()) return;
  let updatedChats = [...chats];
  let newChatId = currentChatId;

  if (currentChatId === null) {
    newChatId = chats.length + 1;
    const newChatTitle = input.slice(0, 20);
    updatedChats = [{ id: newChatId, title: newChatTitle, messages: [{ text: input, type: "user" }] }, ...chats];
    setCurrentChatId(newChatId);
  } else {
    updatedChats = chats.map(chat =>
      chat.id === currentChatId ? { ...chat, messages: [...chat.messages, { text: input, type: "user" }] } : chat
    );
  }

  setChats(updatedChats);
  setInput("");

  try {
    let response;

    if (mode === "FileUpload" && fileRefreshId) {
      const formData = new FormData();
      formData.append("question", input);
      formData.append("refresh_id", fileRefreshId);
      formData.append("mode", "FileUpload");

      response = await fetch(BASE_URL_DEPLOYED, {
        method: "POST",
        body: formData,
  });


    } else if (mode === "ImageSearch" && uploadedImage) {
      const formData = new FormData();
      formData.append("image", uploadedImage);
      formData.append("prompt", input);
      formData.append("mode", "ImageSearch");

      response = await fetch(BASE_URL_DEPLOYED, {
        method: "POST",
        body: formData,
      });

  
    } else {
      response = await fetch(BASE_URL_DEPLOYED, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt: input }),
      });
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { response: text };
    }

    const responseText = data.answer || data.message || data.response || "No response";
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === newChatId
          ? { ...chat, messages: [...chat.messages, { text: responseText, type: "bot" }] }
          : chat
      )
    );
  } catch (error) {
    console.error("Error fetching response:", error);
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === newChatId
          ? { ...chat, messages: [...chat.messages, { text: "Error processing request. Please try again.", type: "bot" }] }
          : chat
      )
    );
  }
};


  // Add a function to handle new file upload (reset refresh_id)
  const handleNewFileUpload = () => {
    setFileRefreshId(null);
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex h-screen ${theme}`}>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".txt"
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageSearch}
      />

      {/* Sidebar */}
      <aside 
        className={`w-64 p-4 flex flex-col transition-all duration-300 border-r ${
          theme === "light" ? "bg-white border-gray-200" : "bg-chat-dark-secondary border-chat-border"
        } ${sidebarOpen ? "block" : "hidden"} md:block`}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold">Chatbot</h2>
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon size={20} className="text-gray-600" />
              ) : (
                <Sun size={20} className="text-gray-400" />
              )}
            </button>
            <button className="icon-button">
              <Settings size={20} className={theme === "light" ? "text-gray-600" : "text-gray-400"} />
            </button>
          </div>
        </div>
        <button
          className="w-full py-2.5 px-4 mb-6 bg-chat-green rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-medium text-white"
          onClick={() => setCurrentChatId(null)}
        >
          + New Chat
        </button>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                chat.id === currentChatId 
                  ? theme === "light"
                    ? "bg-gray-100 text-chat-green"
                    : "bg-chat-border text-chat-green"
                  : theme === "light"
                    ? "hover:bg-gray-50 text-gray-700"
                    : "hover:bg-chat-border text-gray-300"
              }`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className={`p-4 flex items-center justify-between border-b ${
          theme === "light" ? "bg-white border-gray-200" : "bg-chat-dark-secondary border-chat-border"
        }`}>
          <div className="flex items-center gap-3">
            <button className="md:hidden icon-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">AI Assistant</h1>
          </div>
        </header>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${theme === "light" ? "bg-gray-50" : ""}`}>
          {currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="glow-effect mb-6">
                <div className="w-16 h-16 rounded-full bg-chat-green bg-opacity-20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-chat-green" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-3">Welcome to AI Chat</h2>
              <p className={theme === "light" ? "text-gray-600 max-w-md" : "text-gray-400 max-w-md"}>
                I'm here to help with your questions and tasks. Feel free to start a conversation!
              </p>
            </div>
          ) : (
            currentChat.messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} message-fade-in`}
              >
                <div 
                  className={`max-w-[85%] px-5 py-3 rounded-2xl ${
                    msg.type === "user" 
                      ? "message-user"
                      : "message-bot"
                  }`}
                >
                  {msg.imageUrl && (
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded" 
                      className="max-w-full h-auto rounded-lg mb-2"
                    />
                  )}
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Box */}
        <div className={`px-4 py-3 border-t ${
          theme === "light" ? "bg-white border-gray-200" : "bg-chat-dark-secondary border-chat-border"
        }`}>
          <div className="input-container flex items-center gap-2 px-4 py-2 rounded-xl">
            <button 
              className="icon-button"
              onClick={handleNewFileUpload}
              title="Upload File"
            >
              <Paperclip size={20} className={theme === "light" ? "text-gray-600" : "text-gray-400"} />
            </button>
            <button 
              className={`icon-button ${mode === "ImageSearch" ? "text-chat-green" : theme === "light" ? "text-gray-600" : "text-gray-400"}`}
              onClick={() => {
                setMode("ImageSearch");
                imageInputRef.current?.click();
              }}
              title="Image Search"
            >
              <Image size={20} />
            </button>
            <button 
              className={`icon-button ${mode === "WebSearch" ? "text-chat-green" : theme === "light" ? "text-gray-600" : "text-gray-400"}`}
              onClick={() => setMode(prev => prev === "WebSearch" ? "NormalSearch" : "WebSearch")}
              title="Web Search"
            >
              <Search size={20} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none outline-none"
            />
            <button 
              className="icon-button"
              onClick={handleSend}
            >
              <SendHorizontal size={20} className="text-chat-green" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
