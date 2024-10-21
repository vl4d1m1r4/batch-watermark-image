"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function BatchWatermarkApp() {
  const [images, setImages] = useState<File[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [watermarkedImages, setWatermarkedImages] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(files);

    // Generate previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
    setWatermarkedImages([]); // Reset watermarked images when new images are uploaded
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLogo(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const applyWatermark = useCallback(
    (imageUrl: string, logoUrl: string): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const mainImg = new Image();
        const logoImg = new Image();

        mainImg.onload = () => {
          canvas.width = mainImg.width;
          canvas.height = mainImg.height;
          ctx.drawImage(mainImg, 0, 0);

          logoImg.onload = () => {
            const smallerSide = Math.min(mainImg.width, mainImg.height);
            const maxLogoSize = smallerSide * 0.15;
            let logoWidth = logoImg.width;
            let logoHeight = logoImg.height;

            if (logoWidth > logoHeight) {
              if (logoWidth > maxLogoSize) {
                logoHeight *= maxLogoSize / logoWidth;
                logoWidth = maxLogoSize;
              }
            } else {
              if (logoHeight > maxLogoSize) {
                logoWidth *= maxLogoSize / logoHeight;
                logoHeight = maxLogoSize;
              }
            }

            ctx.drawImage(
              logoImg,
              10,
              mainImg.height - logoHeight - 5,
              logoWidth,
              logoHeight
            );

            resolve(canvas.toDataURL());
          };

          logoImg.src = logoUrl;
        };

        mainImg.src = imageUrl;
      });
    },
    []
  );

  const processImages = async () => {
    if (!logo) return;

    const watermarked = await Promise.all(
      images.map(async (image) => {
        const imageUrl = URL.createObjectURL(image);
        return applyWatermark(imageUrl, logo);
      })
    );

    setWatermarkedImages(watermarked);
  };

  const downloadImages = () => {
    watermarkedImages.forEach((image, index) => {
      const link = document.createElement("a");
      link.href = image;
      link.download = `watermarked_image_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Batch Image Watermarking App</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="images">Upload Images</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
        </div>
        <div>
          <Label htmlFor="logo">Upload Logo</Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
          />
        </div>
        <Button onClick={processImages} disabled={images.length === 0 || !logo}>
          Apply Watermark to All Images
        </Button>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Previews</h2>
          <ScrollArea className="h-[300px] w-full border rounded-md p-4">
            <div className="grid grid-cols-3 gap-4">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-auto"
                  />
                  {watermarkedImages[index] && (
                    <img
                      src={watermarkedImages[index]}
                      alt={`Watermarked ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {watermarkedImages.length > 0 && (
          <Button onClick={downloadImages}>
            Download All Watermarked Images
          </Button>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
