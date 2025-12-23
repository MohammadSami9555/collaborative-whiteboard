import { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [showTools, setShowTools] = useState(false);
  const [bgColor, setBgColor] = useState("#f8fafc");

  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctxRef.current = ctx;
  }, []);

  
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("join-board", "default");

    socketRef.current.on("draw", ({ from, to, color, size }) => {
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.stroke();
      ctx.closePath();
    });

    return () => socketRef.current.disconnect();
  }, []);

  
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
  }, [color, size]);

 
  useEffect(() => {
    document.body.style.background = bgColor;
  }, [bgColor]);

 
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key.toLowerCase() === "t") {
        setShowTools((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    const { x, y } = getMousePos(e);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lastX = x;
    ctx.lastY = y;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getMousePos(e);
    const ctx = ctxRef.current;

    ctx.lineTo(x, y);
    ctx.stroke();

    socketRef.current.emit("draw", {
      boardId: "default",
      from: { x: ctx.lastX, y: ctx.lastY },
      to: { x, y },
      color,
      size,
    });

    ctx.lastX = x;
    ctx.lastY = y;
  };

  const stopDrawing = () => {
    const ctx = ctxRef.current;
    ctx.closePath();
    ctx.lastX = null;
    ctx.lastY = null;
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      <button style={styles.toolsBtn} onClick={() => setShowTools(!showTools)}>
        🧰 Tools (T)
      </button>

      {showTools && (
        <div style={{ ...styles.toolbar, animation: "slideDown 0.3s ease-out" }}>
          <div style={styles.group}>
            🎨 <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>

          <div style={styles.group}>
            🟦 <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
          </div>

          <div style={styles.group}>
            ✏️
            <input type="range" min="1" max="20" value={size} onChange={(e) => setSize(e.target.value)} />
            {size}
          </div>

          <button style={styles.clearBtn} onClick={clearBoard}>🧹 Clear</button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </>
  );
}


const styles = {
  toolsBtn: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    animation: "float 2.5s ease-in-out infinite",
    zIndex: 11,
  },
  toolbar: {
    position: "fixed",
    top: 70,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "16px",
    padding: "12px 16px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 10,
  },
  group: { display: "flex", alignItems: "center", gap: "6px" },
  clearBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default App;
