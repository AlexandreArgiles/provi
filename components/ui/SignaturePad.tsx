import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';
import { Eraser, PenTool } from 'lucide-react';

interface SignaturePadProps {
    onEnd: (base64: string | null) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onEnd }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        // Handle Resize to responsive width
        const handleResize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = 200; // Fixed height
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Init

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        
        let clientX, clientY;
        
        if ((event as React.TouchEvent).touches) {
            clientX = (event as React.TouchEvent).touches[0].clientX;
            clientY = (event as React.TouchEvent).touches[0].clientY;
        } else {
            clientX = (event as React.MouseEvent).clientX;
            clientY = (event as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault(); // Prevent scroll on touch
        setIsDrawing(true);
        const { x, y } = getCoordinates(event);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
        }
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        event.preventDefault(); 
        const { x, y } = getCoordinates(event);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
            if(!hasDrawn) setHasDrawn(true);
        }
    };

    const endDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current && hasDrawn) {
            onEnd(canvasRef.current.toDataURL('image/png'));
        }
    };

    const clear = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHasDrawn(false);
            onEnd(null);
        }
    };

    return (
        <div className="space-y-2">
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden relative touch-none">
                <canvas
                    ref={canvasRef}
                    className="cursor-crosshair w-full block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    style={{ touchAction: 'none' }} 
                />
                {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400">
                        <PenTool className="w-8 h-8 mr-2 opacity-50" />
                        <span className="text-lg font-medium opacity-50">Assine aqui</span>
                    </div>
                )}
            </div>
            <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={clear} type="button" className="text-slate-500 hover:text-red-500">
                    <Eraser className="w-4 h-4 mr-2" /> Limpar Assinatura
                </Button>
            </div>
        </div>
    );
};