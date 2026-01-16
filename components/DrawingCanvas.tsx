
import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onDone: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const COLORS = ['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#22C55E', '#A855F7', '#F97316'];
const BRUSH_SIZES = [2, 5, 10];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDone, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Set canvas dimensions based on container size
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
        
        ctx.fillStyle = '#111827'; // Dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
      }
    }
  }, []);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.strokeStyle = isErasing ? '#111827' : color;
    context.lineWidth = isErasing ? brushSize * 3 : brushSize;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };
    
  const clearCanvas = () => {
    if (context && canvasRef.current) {
        context.fillStyle = '#111827';
        context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleDone = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      onDone(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in">
      <div className="w-full h-full max-w-4xl max-h-[80vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col p-4">
        <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
                 {/* Color Palette */}
                <div className="flex items-center gap-2">
                    {COLORS.map(c => (
                        <button key={c} onClick={() => { setColor(c); setIsErasing(false); }} className={`w-8 h-8 rounded-full border-2 ${color === c && !isErasing ? 'border-purple-400 ring-2 ring-purple-400' : 'border-gray-600'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
                 {/* Brush Sizes */}
                 <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                    {BRUSH_SIZES.map(size => (
                        <button key={size} onClick={() => setBrushSize(size)} className={`p-2 rounded ${brushSize === size && !isErasing ? 'bg-purple-600' : ''}`}>
                            <span className="block rounded-full bg-gray-400" style={{ width: `${size}px`, height: `${size}px` }}></span>
                        </button>
                    ))}
                </div>
                {/* Eraser */}
                <button onClick={() => setIsErasing(!isErasing)} className={`p-2 rounded-lg ${isErasing ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} hover:bg-purple-700`}>
                    Eraser
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={clearCanvas} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Clear</button>
                <button onClick={onCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Cancel</button>
                <button onClick={handleDone} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Attach Drawing</button>
            </div>
        </div>
        <div className="flex-grow w-full h-full rounded-lg overflow-hidden">
             <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="cursor-crosshair"
            />
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
