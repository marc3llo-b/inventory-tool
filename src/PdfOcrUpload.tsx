import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ParsedItem {
  artikelnummer: string;
  bezeichnung: string;
}

export default function PdfOcrUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setOcrText("");
      setParsedItems([]);
      setProgress(0);
    }
  };

  const parseTextToTable = (text: string): ParsedItem[] => {
    const lines = text.split("\n");
    const items: ParsedItem[] = [];
    const articleRegex = /(\d{5,})\s+(.+)/; // Beispiel: 101178   Schraube M5x20

    lines.forEach((line) => {
      const match = line.match(articleRegex);
      if (match) {
        items.push({
          artikelnummer: match[1],
          bezeichnung: match[2],
        });
      }
    });
    return items;
  };

  const handleStartOcr = async () => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = () => {
      Tesseract.recognize(reader.result as string, "deu", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.floor(m.progress * 100));
          }
        },
        langPath: "/tesseract-lang-data"
      })
        .then(({ data: { text } }) => {
          setOcrText(text);
          const items = parseTextToTable(text);
          setParsedItems(items);
        })
        .catch((err) => {
          console.error("OCR Fehler:", err);
          setOcrText("Fehler bei der Texterkennung. Bitte versuche es erneut.");
        })
        .finally(() => {
          setIsProcessing(false);
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">🟦 Schritt 1: PDF-Stückliste hochladen</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} className="mb-4" />
      {file && (
        <Button onClick={handleStartOcr} disabled={isProcessing} className="mb-4">
          OCR starten
        </Button>
      )}
      {isProcessing && <Progress value={progress} className="mb-4" />}

      {ocrText && (
        <div className="border p-2 bg-gray-100 rounded mb-4">
          <h2 className="font-semibold mb-2">Erkannter Text (Vorschau):</h2>
          <pre className="whitespace-pre-wrap text-sm max-h-40 overflow-y-auto">{ocrText}</pre>
        </div>
      )}

      {parsedItems.length > 0 && (
        <div className="border p-2 bg-white rounded shadow">
          <h2 className="font-semibold mb-2">Strukturierte Vorschau:</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left">Artikelnummer</th>
                <th className="text-left">Bezeichnung</th>
              </tr>
            </thead>
            <tbody>
              {parsedItems.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td>{item.artikelnummer}</td>
                  <td>{item.bezeichnung}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-right">
        <Button disabled={parsedItems.length === 0}>Weiter</Button>
      </div>
    </div>
  );
}

