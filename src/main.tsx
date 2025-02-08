import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { preloadAudioFiles } from './utils/numberToAudio';

createRoot(document.getElementById("root")!).render(<App />);

// Предзагружаем аудиофайлы после монтирования приложения
preloadAudioFiles().catch(console.error);
