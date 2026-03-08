import { useRef, useState, useEffect, useCallback } from "react";

function Camera({ photo, setPhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState(null);

  // Show either the server URL or the local base64 preview
  const displayPhoto = photo || localPreview;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow access."
          : "Unable to access camera."
      );
    }
  }, []);

  useEffect(() => {
    if (!displayPhoto) {
      startCamera();
    }
    return () => stopCamera();
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/jpeg", 0.85);
    setLocalPreview(image);
    setPhoto(image);
    stopCamera();
  };

  const retake = () => {
    setLocalPreview(null);
    setPhoto(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {!displayPhoto ? (
        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          <button
            type="button"
            onClick={capture}
            disabled={!cameraActive}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture
          </button>
        </>
      ) : (
        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-gray-200">
            <img src={displayPhoto} alt="Captured" className="w-full object-cover" />
          </div>

          <button
            type="button"
            onClick={retake}
            className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retake
          </button>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default Camera;