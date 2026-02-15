import QRCode from "qrcode";

const CANVAS_SIZE = 1024;
const PADDING = 32;
const TEXT_AREA_HEIGHT = 80;
const QR_SIZE = CANVAS_SIZE - PADDING * 2;
const QR_WITH_TEXT = QR_SIZE - TEXT_AREA_HEIGHT;

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
    width: QR_WITH_TEXT,
    margin: 0,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });

  const qrX = (CANVAS_SIZE - QR_WITH_TEXT) / 2;
  ctx.drawImage(qrCanvas, qrX, PADDING, QR_WITH_TEXT, QR_WITH_TEXT);

  const textY = PADDING + QR_WITH_TEXT + 35;
  ctx.textAlign = "center";
  const centerX = CANVAS_SIZE / 2;

  ctx.fillStyle = "#000000";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("Scan to build your order", centerX, textY);

  ctx.fillStyle = "#555555";
  ctx.font = "18px sans-serif";
  ctx.fillText(calculatorUrl, centerX, textY + 32);

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "bakeriq-calculator-qr.png";
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
