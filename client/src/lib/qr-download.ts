import QRCode from "qrcode";

const CANVAS_SIZE = 1024;
const PADDING = 32;
const TEXT_AREA_HEIGHT = 90;
const QR_RENDER_SIZE = CANVAS_SIZE - PADDING * 2 - TEXT_AREA_HEIGHT;

export async function downloadCalculatorQR(calculatorUrl: string) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, calculatorUrl, {
    width: QR_RENDER_SIZE,
    margin: 0,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });

  const qrX = (CANVAS_SIZE - QR_RENDER_SIZE) / 2;
  ctx.drawImage(qrCanvas, qrX, PADDING, QR_RENDER_SIZE, QR_RENDER_SIZE);

  const centerX = CANVAS_SIZE / 2;
  const belowQR = PADDING + QR_RENDER_SIZE;

  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("Scan to build your order", centerX, belowQR + 40);

  ctx.fillStyle = "#999999";
  ctx.font = "16px sans-serif";
  ctx.fillText("Powered by BakerIQ.app", centerX, belowQR + 72);

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "bakeriq-calculator-qr.png";
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
