import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, Image as ImageIcon, X, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageLightbox } from "@/components/community/ImageLightbox";

interface VisionImage {
  id: string;
  url: string;
  caption?: string;
  photographer?: string;
  photographerUrl?: string;
}

interface UnsplashPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

interface VisionBoardImagePickerProps {
  images: VisionImage[];
  onImagesChange: (images: VisionImage[]) => void;
  maxImages?: number;
}

export function VisionBoardImagePicker({ 
  images, 
  onImagesChange, 
  maxImages = 6 
}: VisionBoardImagePickerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("unsplash");

  const searchUnsplash = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-search', {
        body: { query: searchQuery, perPage: 12 }
      });

      if (error) throw error;
      setSearchResults(data.photos || []);
    } catch (error) {
      console.error('Unsplash search error:', error);
      toast({
        title: t("visionBoard.searchError"),
        description: t("visionBoard.searchErrorDesc"),
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, t, toast]);

  const handleSelectUnsplash = (photo: UnsplashPhoto) => {
    if (images.length >= maxImages) {
      toast({
        title: t("visionBoard.maxImagesReached"),
        description: t("visionBoard.maxImagesDesc").replace("{max}", String(maxImages)),
        variant: "destructive"
      });
      return;
    }

    const newImage: VisionImage = {
      id: `unsplash-${photo.id}`,
      url: photo.url,
      caption: photo.alt,
      photographer: photo.photographer,
      photographerUrl: photo.photographerUrl,
    };

    onImagesChange([...images, newImage]);
    setIsDialogOpen(false);
    
    toast({
      title: t("visionBoard.imageAdded"),
      description: `📷 ${photo.photographer}`
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: t("visionBoard.maxImagesReached"),
        description: t("visionBoard.maxImagesDesc").replace("{max}", String(maxImages)),
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const newImages: VisionImage[] = [];

    try {
      for (const file of filesToUpload) {
        // Compress image
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85
        });

        // Upload to storage
        const fileName = `vision-${Date.now()}-${Math.random().toString(36).substring(7)}.${compressed.type.split('/')[1] || 'jpg'}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community')
          .upload(`vision/${fileName}`, compressed);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('community')
          .getPublicUrl(`vision/${fileName}`);

        newImages.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          url: urlData.publicUrl,
          caption: file.name.replace(/\.[^/.]+$/, "")
        });
      }

      onImagesChange([...images, ...newImages]);
      setIsDialogOpen(false);
      
      toast({
        title: t("visionBoard.imagesUploaded"),
        description: t("visionBoard.imagesUploadedDesc").replace("{count}", String(newImages.length))
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t("visionBoard.uploadError"),
        description: t("visionBoard.uploadErrorDesc"),
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchUnsplash();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t("visionBoard.images")} ({images.length}/{maxImages})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={images.length >= maxImages}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          {t("visionBoard.addImage")}
        </Button>
      </div>

      {/* Image grid preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={img.url}
                alt={img.caption || "Vision image"}
                className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={() => setLightboxImage(img.url)}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(img.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              {img.photographer && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                  📷 {img.photographer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image picker dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("visionBoard.addImage")}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unsplash">
                <Search className="h-4 w-4 mr-2" />
                Unsplash
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                {t("visionBoard.upload")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unsplash" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("visionBoard.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button onClick={searchUnsplash} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {searchResults.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => handleSelectUnsplash(photo)}
                      >
                        <img
                          src={photo.thumbUrl}
                          alt={photo.alt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                          <a
                            href={photo.photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-white/80 hover:text-white flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {photo.photographer}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Search className="h-12 w-12 mb-4 opacity-20" />
                    <p>{t("visionBoard.searchHint")}</p>
                  </div>
                )}
              </ScrollArea>

              <p className="text-xs text-muted-foreground text-center">
                {t("visionBoard.unsplashCredit")}
              </p>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t("visionBoard.uploadHint")}</p>
                <Label htmlFor="vision-upload" className="cursor-pointer">
                  <Button type="button" disabled={isUploading} asChild>
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("visionBoard.uploading")}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {t("visionBoard.selectFiles")}
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <input
                  id="vision-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          alt="Vision board image"
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
