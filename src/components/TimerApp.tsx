import React, { useState, useEffect, useRef } from "react";
import {
  getAudioSequenceForNumber,
  playAudioSequence,
} from "../utils/numberToAudio";
import { promiseLast } from "../utils/promiseLast";

const TimerApp: React.FC = () => {
  // Состояния для ввода, оставшегося времени, общей длительности, режима работы и старта таймера
  const [inputValue, setInputValue] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Состояние для отслеживания ширины окна (для адаптивного размера таймера)
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Рефы для доступа к актуальным значениям внутри асинхронного цикла
  const timeLeftRef = useRef(timeLeft);
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Обработчик изменения поля ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(parseInt(e.target.value, 10) || 0);
  };

  // Запуск таймера: сохраняем введённое значение как общее и оставшееся время
  const handleStart = () => {
    if (inputValue > 0) {
      setTimeLeft(inputValue);
      setTotalSeconds(inputValue);
      setIsRunning(true);
      setIsStarted(true);
    }
  };

  // Сброс таймера
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTotalSeconds(0);
    setIsStarted(false);
  };

  // При клике на область таймера переключаем состояние: если таймер работает – ставим на паузу, если на паузе – продолжаем
  const handleTimerClick = () => {
    if (!isStarted || timeLeft === 0) return;
    setIsRunning((prev) => !prev);
  };

  // Асинхронный цикл тактов таймера: каждые 1 секунду, если таймер запущен, уменьшаем timeLeft и воспроизводим аудио.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!isRunningRef.current || timeLeftRef.current <= 0 || cancelled) {
        handleReset();
        return;
      }

      // Сначала получаем и воспроизводим аудио для текущего значения
      const currentTimeLeft = timeLeftRef.current;
      const audioFiles = getAudioSequenceForNumber(currentTimeLeft);
      await promiseLast([
        playAudioSequence(audioFiles),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      if (!isRunningRef.current || cancelled) return;

      // И только потом уменьшаем значение таймера
      timeLeftRef.current = timeLeftRef.current - 1;

      setTimeLeft((prev) => prev - 1);

      if (cancelled) return;
      tick();
    };

    if (isRunningRef.current && timeLeftRef.current > 0) {
      tick();
    }
    return () => {
      cancelled = true;
    };
  }, [isRunning]);

  // Расчет адаптивного размера круга:
  // Таймер занимает 80% ширины экрана, но не более 320px.
  const circleSize = Math.min(windowWidth * 0.8, 380);
  const strokeWidth = circleSize / 12;
  const radius = circleSize / 2 - strokeWidth / 2;
  const center = circleSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  // Добавим функцию для управления полноэкранным режимом
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Добавим эффект для отслеживания изменений полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div style={styles.appContainer}>
      <h1 style={styles.title}>Таймер для сна</h1>
      <div
        style={{
          ...styles.timerWrapper,
          width: circleSize,
          height: circleSize,
        }}
        onClick={handleTimerClick}
      >
        <svg width={circleSize} height={circleSize} style={styles.svg}>
          {/* Фоновый круг */}
          <circle
            stroke="#57606f"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={center}
            cy={center}
          />
          {/* Прогресс-окружность */}
          <circle
            stroke="#9c88ff"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={center}
            cy={center}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
        </svg>
        {/* Центральный текст с оставшимися секундами */}
        <div style={styles.timerText}>{timeLeft}</div>
        {/* Оверлей для режима паузы */}
        {!isRunning && isStarted && timeLeft > 0 && (
          <div
            style={{ ...styles.overlay, width: circleSize, height: circleSize }}
          >
            <span style={styles.overlayText}>| |</span>
          </div>
        )}
      </div>
      <div style={styles.controls}>
        <input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Секунды"
          inputMode="numeric"
          pattern="[0-9]*"
          style={styles.input}
        />
        <div style={styles.buttons}>
          <button
            onClick={handleStart}
            disabled={isRunning || isStarted}
            style={styles.button}
          >
            Запустить
          </button>
          <button onClick={handleReset} style={styles.button}>
            Сброс
          </button>
        </div>
      </div>
      <div style={styles.info}>
        {isRunning ? (
          <p style={styles.infoText}>
            Таймер работает. Нажмите на круг, чтобы поставить на паузу.
          </p>
        ) : isStarted && timeLeft > 0 ? (
          <p style={styles.infoText}>
            Таймер на паузе. Нажмите на круг, чтобы продолжить.
          </p>
        ) : (
          <p style={styles.infoText}>Введите время и нажмите "Запустить".</p>
        )}
      </div>
      <button onClick={toggleFullscreen} style={styles.fullscreenButton}>
        {isFullscreen ? "⛶" : "⛶"}
      </button>
    </div>
  );
};

const styles = {
  appContainer: {
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    color: "#F5F6FA", // светлый текст
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },
  title: {
    marginBottom: "20px",
    fontSize: "2.5rem",
    color: "#9c88ff", // акцентный пастельный фиолетовый
    textAlign: "center",
  },
  timerWrapper: {
    position: "relative",
    marginBottom: "30px",
    cursor: "pointer",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    transform: "rotate(-90deg)",
  },
  timerText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "3rem",
    fontWeight: "bold",
    color: "#F5F6FA",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(47, 54, 64, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
  },
  overlayText: {
    fontSize: "4rem",
    color: "#F5F6FA",
    fontWeight: "900",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  buttons: {
    display: "flex",
    gap: "10px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    border: "2px solid #9c88ff",
    borderRadius: "5px",
    backgroundColor: "#3B3B3B",
    color: "#F5F6FA",
    width: "100px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: "#9c88ff",
    color: "#2F3640",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  info: {
    textAlign: "center",
    minHeight: "80px",
  },
  infoText: {
    fontSize: "16px",
    color: "#F5F6FA",
  },
  fullscreenButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "rgba(156, 136, 255, 0.3)",
    color: "#F5F6FA",
    border: "none",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(5px)",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "rgba(156, 136, 255, 0.4)",
    },
    ":active": {
      transform: "scale(0.95)",
    },
  },
} as const;

export default TimerApp;
