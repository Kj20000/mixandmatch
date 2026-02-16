import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  getAllPairs, getSettings, updateSettings, addPair, deletePair,
  type WordImagePair, type AppSettings,
} from "@/lib/db";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({ pairsCount: 3, soundEnabled: true });
  const [pairs, setPairs] = useState<WordImagePair[]>([]);
  const [newWordEn, setNewWordEn] = useState("");
  const [newWordHi, setNewWordHi] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newAudioUrl, setNewAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [p, s] = await Promise.all([getAllPairs(), getSettings()]);
    setPairs(p);
    setSettings(s);
  };

  const handlePairsCountChange = async (val: number[]) => {
    const count = val[0];
    setSettings(s => ({ ...s, pairsCount: count }));
    await updateSettings({ pairsCount: count });
  };

  const handleSoundToggle = async (checked: boolean) => {
    setSettings(s => ({ ...s, soundEnabled: checked }));
    await updateSettings({ soundEnabled: checked });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => setNewAudioUrl(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  const handleAddPair = async () => {
    if (!newWordEn.trim() || !newImageUrl) return;
    const pair: WordImagePair = {
      id: `custom-${Date.now()}`,
      wordEn: newWordEn.trim(),
      wordHi: newWordHi.trim() || undefined,
      imageUrl: newImageUrl,
      audioUrl: newAudioUrl || undefined,
    };
    await addPair(pair);
    setNewWordEn("");
    setNewWordHi("");
    setNewImageUrl("");
    setNewAudioUrl("");
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await deletePair(id);
    loadData();
  };

  return (
    <div className="min-h-[100dvh] bg-background p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-card shadow-sm">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
      </div>

      {/* Pairs count */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label className="text-lg font-display font-semibold mb-4 block">
            Number of pairs: {settings.pairsCount}
          </Label>
          <Slider
            value={[settings.pairsCount]}
            onValueChange={handlePairsCountChange}
            min={1}
            max={6}
            step={1}
            className="mt-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>1</span><span>6</span>
          </div>
        </CardContent>
      </Card>

      {/* Sound toggle */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center justify-between">
          <Label className="text-lg font-display font-semibold">Sound</Label>
          <Switch checked={settings.soundEnabled} onCheckedChange={handleSoundToggle} />
        </CardContent>
      </Card>

      {/* Word-image pairs */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-foreground">Word-Image Pairs</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Pair</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Word (English) *</Label>
                <Input value={newWordEn} onChange={e => setNewWordEn(e.target.value)} placeholder="e.g. Dog" />
              </div>
              <div>
                <Label>Word (Hindi)</Label>
                <Input value={newWordHi} onChange={e => setNewWordHi(e.target.value)} placeholder="e.g. कुत्ता" />
              </div>
              <div>
                <Label>Image *</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {newImageUrl && (
                  <img src={newImageUrl} alt="Preview" className="mt-2 w-20 h-20 object-contain rounded-lg bg-muted" />
                )}
              </div>
              <div>
                <Label>Voice Recording</Label>
                <div className="flex gap-2 mt-1">
                  {!recording ? (
                    <Button type="button" variant="outline" size="sm" onClick={startRecording} className="gap-1">
                      <Mic className="w-4 h-4" /> Record
                    </Button>
                  ) : (
                    <Button type="button" variant="destructive" size="sm" onClick={stopRecording} className="gap-1">
                      <Square className="w-4 h-4" /> Stop
                    </Button>
                  )}
                  {newAudioUrl && <span className="text-sm text-success self-center">✓ Recorded</span>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddPair} disabled={!newWordEn.trim() || !newImageUrl}>
                Add Pair
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {pairs.map(pair => (
          <Card key={pair.id} className="overflow-hidden">
            <CardContent className="p-3 flex items-center gap-3">
              <img
                src={pair.imageUrl}
                alt={pair.wordEn}
                className="w-14 h-14 rounded-xl object-contain bg-muted flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{pair.wordEn}</p>
                {pair.wordHi && <p className="text-sm text-muted-foreground truncate">{pair.wordHi}</p>}
                {pair.isDefault && <span className="text-xs text-muted-foreground">Built-in</span>}
              </div>
              {!pair.isDefault && (
                <button
                  onClick={() => handleDelete(pair.id)}
                  className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
