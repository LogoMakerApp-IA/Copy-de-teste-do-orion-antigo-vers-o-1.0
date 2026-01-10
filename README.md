# 🤖 ORION — Personal Intelligence

ORION é um assistente pessoal inteligente, multimodal e proativo, projetado para interagir com o usuário por texto, voz, arquivos e imagens, oferecendo uma experiência moderna, fluida e contextual.

Este projeto está em **fase ALPHA**, focado em testes funcionais, arquitetura e evolução cognitiva da IA.

---

## ✨ Funcionalidades Atuais

- 💬 Chat inteligente com histórico
- 🧠 Integração com IA (Google Gemini)
- 🎤 Entrada por voz (Speech-to-Text)
- 🔊 Resposta por voz (Text-to-Speech)
- 📎 Upload de arquivos e imagens
- 📷 Captura de imagem pela câmera
- 🌓 Tema claro / escuro (seguindo o sistema)
- 🎨 Interface animada e responsiva
- 📱 Preparação para PWA / APK

---

## 🧠 Estado Cognitivo do ORION

O ORION opera com estados cognitivos bem definidos:

- **IDLE** → aguardando interação
- **LISTENING** → escutando comando de voz
- **THINKING** → processando resposta da IA
- **TYPING** → gerando resposta visual

Esses estados controlam animações, feedback visual e comportamento do assistente.

---

## 🛠️ Tecnologias Utilizadas

- **React + TypeScript**
- **Vite**
- **Tailwind CSS**
- **Google Gemini API**
- **Web Speech API**
- **PWA (Service Worker)**
- **Lucide Icons**

---

## 📂 Estrutura do Projeto

```txt
src/
 ├── App.tsx
 ├── index.tsx
 ├── types.ts
 ├── services/
 │    └── geminiService.ts
 ├── components/
 │    └── ChatInterface.tsx
 ├── state/
 ├── sw.js
 ├── manifest.json
 └── metadata.json