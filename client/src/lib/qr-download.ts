import QRCode from "qrcode";

const CANVAS_SIZE = 1024;
const PADDING = 40;
const BOTTOM_TEXT_AREA = 110;

export async function downloadCalculatorQR(calculatorUrl: string, businessName?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const centerX = CANVAS_SIZE / 2;
  const maxTextWidth = CANVAS_SIZE - PADDING * 2;
  const topTextArea = businessName ? 100 : 0;
  const qrSize = CANVAS_SIZE - PADDING * 2 - topTextArea - BOTTOM_TEXT_AREA;

  if (businessName) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    let fontSize = 36;
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (ctx.measureText(businessName).width > maxTextWidth && fontSize > 18) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    ctx.fillText(businessName, centerX, PADDING + 50, maxTextWidth);
  }

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, calculatorUrl, {
    width: qrSize,
    margin: 0,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });

  const qrX = (CANVAS_SIZE - qrSize) / 2;
  const qrY = PADDING + topTextArea;
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  const belowQR = qrY + qrSize;

  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("Scan to build your next order!", centerX, belowQR + 45);

  ctx.fillStyle = "#999999";
  ctx.font = "16px sans-serif";
  ctx.fillText("Powered by BakerIQ.app", centerX, belowQR + 80);

  const fileName = businessName
    ? `${businessName.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`
    : "bakeriq-calculator-qr.png";

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
