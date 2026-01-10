import React, { useRef, useEffect, useState } from 'react';
import { Message, Sender, AppSettings, DeviceState } from '../types';
import { 
  ArrowUp, 
  Paperclip, 
  Camera, 
  ImageIcon,
  X,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  messages: Message[];
  inputValue: string;
  isThinking: boolean;
  onInputChange: (val: string) => void;
  onSend: (text?: string, attachments?: { data: string; mimeType: string }[]) => void;
  onQuickSend: (text: string) => void;
  onFeedback?: (id: string, feedback: 'like' | 'dislike' | null) => void;
  onConfirmAction?: (id: string, confirmed: boolean) => void;
  onNavigate?: (target: 'chat' | 'routines' | 'settings' | 'history') => void;
  settings: AppSettings;
  deviceState: DeviceState;
}

const ChatInterface: React.FC<Props> = ({ 
  messages,
  inputValue,
  isThinking,
  onInputChange,
  onSend,
  onFeedback,
  onConfirmAction,
  onNavigate,
  settings,
  deviceState
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [attachments, setAttachments] = useState<
    { data: string; mimeType: string; name: string }[]
  >([]);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setAttachments((prev) => [
          ...prev,
          { data: base64, mimeType: file.type, name: file.name }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64 = dataUrl.split(',')[1];

    setAttachments((prev) => [
      ...prev,
      {
        data: base64,
        mimeType: 'image/jpeg',
        name: `capture_${Date.now()}.jpg`
      }
    ]);

    stopCamera();
  };

  const handleInternalSend = () => {
    const attsToSend = attachments.map((a) => ({
      data: a.data,
      mimeType: a.mimeType
    }));

    onSend(inputValue, attsToSend);
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full w-full bg-material-surface overflow-hidden">

      {/* Camera Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full"
              />
              <button
                onClick={stopCamera}
                className="p-4 bg-red-500 text-white rounded-full"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === Sender.USER ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === Sender.USER
                    ? 'bg-material-primary text-material-on-primary'
                    : 'bg-material-surface-container text-material-on-surface border border-material-outline-variant/10'
                }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Loader2 size={14} className="animate-spin" />
              ORION está pensando…
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-material-outline-variant/10">
        <div className="max-w-3xl mx-auto">

          {attachments.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-material-surface-container"
                >
                  <ImageIcon size={14} />
                  <span className="text-xs truncate max-w-[100px]">
                    {att.name}
                  </span>
                  <button onClick={() => removeAttachment(idx)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-material-surface-container rounded-3xl p-2">
            <button onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={20} />
            </button>
            <button onClick={startCamera}>
              <Camera size={20} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileUpload}
            />

            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleInternalSend();
                }
              }}
              placeholder="Digite sua mensagem…"
              className="flex-1 bg-transparent resize-none outline-none text-sm px-2"
            />

            <button
              onClick={handleInternalSend}
              disabled={isThinking || (!inputValue.trim() && attachments.length === 0)}
              className="p-3 rounded-full bg-material-primary text-material-on-primary disabled:opacity-50"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;