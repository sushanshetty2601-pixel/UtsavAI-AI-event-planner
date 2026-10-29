"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/app-context";
import { AppShell } from "@/components/app-shell";
import { PhotoAnalysis, ReferenceTheme } from "@/types";
import {
  saveImageBlob,
  getImageUrl,
  deleteImage,
  compressImage,
  getStorageEstimate,
} from "@/lib/image-db";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Plus,
  Check,
  Coins,
  Clock,
  Users,
  HardDrive,
} from "lucide-react";

// Curated Reference Themes including wedding, birthday, marriage, and party themes
const REFERENCE_THEMES: ReferenceTheme[] = [
  {
    id: "ref-wedding-1",
    category: "wedding",
    title: "Royal Rajputana & Marigold Splendor",
    subtitle: "Traditional Indian Grandeur (Inspired by FOREVER Us)",
    description: "Cascading marigold and jasmine garlands, antique brass samai oil lamps, deep crimson drapes, and an illuminated mandap canopy.",
    imageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    palette: ["#8A1C2E", "#D4AF37", "#FAF7F2", "#120F1A"],
    tags: ["Indian Wedding", "Traditional", "Mandap", "Royal"],
    estimatedCostRange: "₹25,000 – ₹60,000",
    keyElements: ["Brass oil lamps (samai)", "Marigold floral tassels", "Silk brocade drapes", "Carved wooden mandap pillars"],
  },
  {
    id: "ref-wedding-2",
    category: "wedding",
    title: "Ivory & Champagne Romantic Arch",
    subtitle: "Modern Luxury Romance (DREAMDAY Editorial Style)",
    description: "Curved arched floral structures with creamy white roses, pampas grass plumes, brass taper candles, and layered ivory linens.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    palette: ["#FAF7F2", "#F2D9C0", "#E4D5B7", "#302039"],
    tags: ["Editorial", "Outdoor / Lawn", "Pastel", "Floral Arch"],
    estimatedCostRange: "₹18,000 – ₹45,000",
    keyElements: ["Arched floral installation", "Pampas grass arrangements", "Brass taper candleholders", "Textured gauze runners"],
  },
  {
    id: "ref-birthday-1",
    category: "birthday",
    title: "Golden Glamour Milestone 30th",
    subtitle: "Sophisticated Evening Party Theme",
    description: "Chrome gold, black, and champagne balloon arches with custom warm neon 'Cheers to 30' sign, fairy light curtain, and pedestal cake stand.",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    palette: ["#D4AF37", "#120F1A", "#EF7187", "#FAF7F2"],
    tags: ["Milestone Birthday", "Neon Sign", "Cocktails", "Glamour"],
    estimatedCostRange: "₹10,000 – ₹25,000",
    keyElements: ["Custom LED neon sign", "Chrome balloon installation", "Fairy light backdrop", "Shimmer photo wall"],
  },
  {
    id: "ref-birthday-2",
    category: "birthday",
    title: "Boho Sunset Garden Picnic Party",
    subtitle: "Warm, Joyful Daytime Birthday Celebration",
    description: "Low pallet dining tables with plush floor cushions, peach and coral dried florals, macrame runners, and hanging wicker lanterns.",
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
    palette: ["#EF7187", "#E4A076", "#FAF7F2", "#638773"],
    tags: ["Outdoor Picnic", "Daytime", "Boho Chic", "Family-Friendly"],
    estimatedCostRange: "₹8,000 – ₹20,000",
    keyElements: ["Low floor cushion seating", "Macrame table runners", "Wicker ambient lanterns", "Dried palm & flower vases"],
  },
  {
    id: "ref-party-1",
    category: "party",
    title: "Neon Disco Cocktail Gala",
    subtitle: "High-Energy Evening Celebration",
    description: "Moody midnight plum uplighting, mirrored disco balls, vibrant magenta florals, and a dedicated signature cocktail bar station.",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    palette: ["#120F1A", "#9782E8", "#EF7187", "#83D9C9"],
    tags: ["Evening Gala", "Dance & Music", "Modern", "Cocktail Bar"],
    estimatedCostRange: "₹15,000 – ₹35,000",
    keyElements: ["Suspended disco ball cluster", "Perimeter LED color uplights", "Custom illuminated bar counter", "Smoke & laser accents"],
  },
  {
    id: "ref-anniversary-1",
    category: "anniversary",
    title: "Silver & Starlight Intimate Celebration",
    subtitle: "Timeless Golden / Silver Milestone",
    description: "Canopy of warm fairy lights simulating a star-filled sky, delicate crystal glassware, silver eucalyptus runners, and soft violin soundtrack.",
    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    palette: ["#FAF7F2", "#B8A4FF", "#302039", "#83D9C9"],
    tags: ["Anniversary", "Intimate", "Romantic", "Starlight"],
    estimatedCostRange: "₹12,000 – ₹30,000",
    keyElements: ["Fairy light starlight ceiling canopy", "Crystal candle candelabras", "Silver-sprayed eucalyptus", "Personalized memory timeline"],
  },
];

/**
 * Component to safely load and render an image from IndexedDB or an external URL
 */
function AnalysisThumbnail({ analysis }: { analysis: PhotoAnalysis }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    if (analysis.imageId) {
      getImageUrl(analysis.imageId).then((url) => {
        if (active && url) {
          setResolvedUrl(url);
          if (url.startsWith("blob:")) {
            objectUrlToRevoke = url;
          }
        }
      });
    } else if (analysis.imageUrl && analysis.imageUrl.startsWith("http")) {
      // Use a microtask to avoid synchronous setState inside the effect body
      const url = analysis.imageUrl;
      Promise.resolve().then(() => {
        if (active) setResolvedUrl(url);
      });
    }

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [analysis.imageId, analysis.imageUrl]);

  if (!resolvedUrl) {
    return (
      <div className="w-full h-48 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
        <ImageIcon className="w-8 h-8 opacity-40" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-border bg-black/5">
      <img
        src={resolvedUrl}
        alt={analysis.imageName || "Inspiration reference"}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function InspirationPage() {
  const {
    activeEvent,
    photoAnalyses,
    savePhotoAnalysis,
    deletePhotoAnalysis,
    createExpense,
    createTask,
    loadDemoEvent,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"themes" | "studio">("themes");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userNotes, setUserNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);

  // Transient state for currently picked image
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [pendingImageId, setPendingImageId] = useState<string | null>(null);

  const [activeAnalysis, setActiveAnalysis] = useState<PhotoAnalysis | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencySymbol = activeEvent?.currency?.symbol || "₹";

  // Check storage estimate on mount
  useEffect(() => {
    getStorageEstimate().then((est) => {
      if (est.isAvailable && est.usageMB > 0) {
        setStorageStatus(`IndexedDB media storage: ~${est.usageMB} MB in use`);
      }
    });

    return () => {
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, or WEBP).");
      return;
    }

    setPreparingImage(true);
    setPreviewName(file.name);

    try {
      // 1. Client-side image compression to web-friendly dimensions
      const compressed = await compressImage(file, 1400, 1400, 0.82);

      // 2. Save binary blob into IndexedDB immediately (OFFLOAD FROM LOCALSTORAGE)
      const storedImage = await saveImageBlob({
        eventId: activeEvent?.id || "default-event",
        fileOrBlob: compressed.blob,
        filename: file.name,
      });

      // 3. Keep imageId and temporary blob URL for UI preview
      setPendingImageId(storedImage.id);
      setCompressedDataUrl(compressed.dataUrl);

      // Create a memory-safe object URL for preview
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      const objUrl = URL.createObjectURL(compressed.blob);
      setPreviewBlobUrl(objUrl);
    } catch (err) {
      console.error("Failed preparing image", err);
      alert("Failed to process image. Please try another file.");
    } finally {
      setPreparingImage(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!compressedDataUrl || !pendingImageId) return;
    setAnalyzing(true);
    setActionFeedback(null);

    try {
      // Call server API for vision analysis
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressedDataUrl,
          imageId: pendingImageId,
          imageName: previewName,
          eventId: activeEvent?.id || "temp-event",
          guestCount: activeEvent?.guestCount || 50,
          userNotes,
          occasion: activeEvent?.occasion || "Celebration",
          budget: activeEvent?.budget || 25000,
        }),
      });

      const analysisData = await res.json();
      if (analysisData && !analysisData.error) {
        // Ensure imageId is linked and imageUrl is empty in stored metadata
        const analysisToSave: PhotoAnalysis = {
          ...analysisData,
          imageId: pendingImageId,
          imageUrl: "", // Clean: Never write heavy base64 to localStorage
          imageName: previewName,
        };

        savePhotoAnalysis(analysisToSave);
        setActiveAnalysis(analysisToSave);
        setActiveTab("studio");
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeThemeDirectly = (theme: ReferenceTheme) => {
    if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(theme.imageUrl);
    setPreviewName(`${theme.title}.jpg`);
    setCompressedDataUrl(theme.imageUrl);
    setPendingImageId(`theme-${theme.id}`);
    setUserNotes(`Reference theme: ${theme.title} (${theme.subtitle})`);
    setActiveTab("studio");
  };

  const handleAddDecorExpense = (alt: { title: string; costRange: string; reason: string }) => {
    if (!activeEvent) return;
    const match = alt.costRange.match(/\d+[\d,]*/);
    const amount = match ? Number(match[0].replace(/,/g, "")) : 5000;

    createExpense({
      eventId: activeEvent.id,
      title: alt.title,
      category: "decoration",
      estimatedAmount: amount,
      quotedAmount: amount,
      actualAmount: 0,
      paymentStatus: "unpaid",
      notes: `Added from Inspiration Studio: ${alt.reason}`,
    });

    setActionFeedback(`Added "${alt.title}" to Budget (+${currencySymbol}${amount.toLocaleString()})!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleCreateDecorTask = (taskTitle: string) => {
    if (!activeEvent) return;
    createTask({
      eventId: activeEvent.id,
      title: `Finalize Decor: ${taskTitle}`,
      category: "decoration",
      priority: "high",
      status: "pending",
      dueDate: activeEvent.date || new Date().toISOString().split("T")[0],
      notes: "Created via Inspiration Studio analysis",
    });

    setActionFeedback(`Created task "Finalize Decor: ${taskTitle}"!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleDeleteAnalysisItem = async (analysis: PhotoAnalysis) => {
    if (analysis.imageId) {
      await deleteImage(analysis.imageId);
    }
    deletePhotoAnalysis(analysis.id);
    if (activeAnalysis?.id === analysis.id) {
      setActiveAnalysis(null);
    }
    setActionFeedback("Deleted photo analysis and associated media.");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const filteredThemes = REFERENCE_THEMES.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                Inspiration & Multimodal Studio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Explore reference wedding & birthday party themes, or upload your venue photograph for AI multimodal decoration recommendations.
            </p>
            {storageStatus && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <HardDrive className="w-3 h-3 text-sage" />
                <span>{storageStatus} (Local storage safely offloaded to IndexedDB)</span>
              </p>
            )}
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-card border border-border shadow-xs">
            <button
              onClick={() => setActiveTab("themes")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "themes"
                  ? "gradient-cta text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Curated Themes
            </button>
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "studio"
                  ? "gradient-cta text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>AI Photo Studio</span>
              {photoAnalyses.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {photoAnalyses.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {actionFeedback && (
          <div className="p-3.5 rounded-xl bg-sage/15 border border-sage/30 text-sage text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* TAB 1: CURATED REFERENCE THEMES */}
        {activeTab === "themes" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Themes" },
                { id: "wedding", label: "💍 Weddings & Mandap" },
                { id: "birthday", label: "🎂 Milestone Birthdays" },
                { id: "party", label: "🎊 Evening Galas & Parties" },
                { id: "anniversary", label: "💑 Anniversaries" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? "bg-foreground text-background shadow-xs"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-all flex flex-col group"
                >
                  {/* Photo Preview Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={theme.imageUrl}
                      alt={theme.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {theme.tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/20"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {theme.subtitle}
                      </p>
                      <h3 className="font-serif text-lg font-bold leading-tight">
                        {theme.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {theme.description}
                    </p>

                    {/* Color Palette Swatches */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Color Palette
                      </span>
                      <div className="flex items-center gap-2">
                        {theme.palette.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-lg border border-border/60 shadow-xs"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        <span className="text-[11px] font-bold text-foreground ml-auto">
                          Est: {theme.estimatedCostRange}
                        </span>
                      </div>
                    </div>

                    {/* Key Elements Checklist */}
                    <div className="space-y-1 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                      {theme.keyElements.map((el, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{el}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button: Analyze in Studio */}
                    <button
                      onClick={() => handleAnalyzeThemeDirectly(theme)}
                      className="w-full py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-xs hover:opacity-95 flex items-center justify-center gap-1.5 transition-opacity mt-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze with AI Studio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AI PHOTO STUDIO */}
        {activeTab === "studio" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Upload Area Card */}
            <div className="rounded-3xl border border-dashed border-border bg-card p-6 sm:p-8 text-center space-y-4 shadow-card">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              {!previewBlobUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer py-6 space-y-3"
                >
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl shadow-xs">
                    {preparingImage ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {preparingImage ? "Processing Image..." : "Upload Inspiration Photograph"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Upload venue photographs, mandap layouts, floral table runners, or birthday backdrops (PNG, JPG, WEBP). Stored safely in IndexedDB without consuming localStorage quota.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={preparingImage}
                    className="px-5 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-sm"
                  >
                    Select Photo from Device
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-xl mx-auto">
                  <div className="relative rounded-2xl overflow-hidden border border-border max-h-64 bg-black/5">
                    <img
                      src={previewBlobUrl}
                      alt="Uploaded preview"
                      className="w-full h-64 object-contain"
                    />
                    <button
                      onClick={() => {
                        if (previewBlobUrl.startsWith("blob:")) {
                          URL.revokeObjectURL(previewBlobUrl);
                        }
                        setPreviewBlobUrl(null);
                        setPreviewName("");
                        setCompressedDataUrl(null);
                        setPendingImageId(null);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1 text-left">
                      Notes / Venue Context (Optional)
                    </label>
                    <input
                      type="text"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="e.g. This is our outdoor terrace venue; we want a similar fairy light canopy."
                      className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      disabled={analyzing || !pendingImageId}
                      onClick={handleAnalyzeImage}
                      className="px-6 py-2.5 rounded-xl gradient-cta text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing with Gemini Vision...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Analyze with UtsavAI Vision</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Most Recent or Selected Analysis */}
            {(activeAnalysis || photoAnalyses.length > 0) && (
              <div className="space-y-6">
                {(() => {
                  const current = activeAnalysis || photoAnalyses[0];
                  return (
                    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                              AI Vision Analysis
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(current.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-foreground mt-0.5">
                            {current.visualAnalysis.generalStyle}
                          </h3>
                        </div>

                        <button
                          onClick={() => handleDeleteAnalysisItem(current)}
                          className="px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 text-xs font-semibold self-start sm:self-center transition-colors"
                        >
                          Delete Analysis
                        </button>
                      </div>

                      {/* Display Image Thumbnail from IndexedDB */}
                      <AnalysisThumbnail analysis={current} />

                      {/* 1. Visual Observations & Color Palette */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Visual Observations
                          </h4>
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {current.visualAnalysis.decorElements.map((el, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{el}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-foreground">Floral Style: </span>
                            <span className="text-xs text-muted-foreground">{current.visualAnalysis.floralStyle}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-foreground">Lighting: </span>
                            <span className="text-xs text-muted-foreground">{current.visualAnalysis.lighting}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Color Palette Identified
                          </h4>
                          <div className="flex items-center gap-2">
                            {current.visualAnalysis.dominantColors.map((c, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div
                                  className="w-10 h-10 rounded-xl border border-border shadow-xs"
                                  style={{ backgroundColor: c }}
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">{c}</span>
                              </div>
                            ))}
                          </div>

                          {current.visualAnalysis.constraints.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs space-y-1 mt-3">
                              <span className="font-bold">Venue Constraints to Consider:</span>
                              {current.visualAnalysis.constraints.map((c, i) => (
                                <p key={i}>• {c}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Quantity Guidance (Based on Guest Count) */}
                      <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" />
                            Quantity Guidance (Calculated for {activeEvent?.guestCount || 50} Guests)
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tables</p>
                            <p className="font-bold text-foreground mt-0.5">{current.quantityGuidance.tables}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Chairs</p>
                            <p className="font-bold text-foreground mt-0.5">{current.quantityGuidance.chairs}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Centerpieces</p>
                            <p className="font-bold text-foreground mt-0.5">{current.quantityGuidance.centerpieces}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Lighting</p>
                            <p className="font-bold text-foreground mt-0.5">{current.quantityGuidance.lightingUnits}</p>
                          </div>
                        </div>
                      </div>

                      {/* 3. Practical Budget Alternatives & Actions */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Practical Budget Packages (Click to Add to Event Budget)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {current.budgetAlternatives.map((alt, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-2xl border border-border bg-card space-y-3 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      alt.priority === "essential"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {alt.priority}
                                  </span>
                                  <span className="font-bold text-xs text-foreground">
                                    {alt.costRange}
                                  </span>
                                </div>
                                <h5 className="font-bold text-sm text-foreground mt-2">{alt.title}</h5>
                                <p className="text-xs text-muted-foreground mt-1">{alt.reason}</p>
                              </div>

                              <div className="pt-2 flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddDecorExpense(alt)}
                                  className="w-full py-1.5 rounded-xl gradient-cta text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-1"
                                >
                                  <Coins className="w-3 h-3" />
                                  <span>Add to Budget</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCreateDecorTask(alt.title)}
                                  className="w-full py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground transition-colors flex items-center justify-center gap-1"
                                >
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span>Add Setup Task</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
