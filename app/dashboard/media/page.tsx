"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Edit2, Upload, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Group {
  id: string;
  name: string;
  enabled: boolean;
}

interface Media {
  id: string;
  groupId: string;
  groupIds?: string[]; // Для поддержки нескольких групп
  url: string | null;
  name: string | null;
  status: "PENDING" | "READY" | "FAILED";
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [formData, setFormData] = useState({
    groupIds: [] as string[],
    name: "",
    url: "",
    file: null as File | null,
  });

  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const fetchMedia = async () => {
    try {
      const response = await fetch(apiUrl("media"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(apiUrl("group"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchMedia();
  }, []);

  const handleSave = async () => {
    if (formData.groupIds.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну группу",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === "upload" && !formData.file) {
      toast({
        title: "Ошибка",
        description: "Выберите файл",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === "url" && !formData.url) {
      toast({
        title: "Ошибка",
        description: "Введите URL",
        variant: "destructive",
      });
      return;
    }

    try {
      if (uploadMode === "upload" && formData.file) {
        const uploadFormData = new FormData();
        // Отправляем каждую группу отдельно (для совместимости с API)
        formData.groupIds.forEach((groupId) => {
          uploadFormData.append("groupIds[]", groupId);
        });
        uploadFormData.append("file", formData.file);
        if (formData.name) uploadFormData.append("name", formData.name);

        const response = await fetch(apiUrl("media/upload"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData,
        });

        if (response.status === 202) {
          // Файл принят, конвертация началась
          const data = await response.json();
          toast({
            title: "Файл принят",
            description: "Файл отправлен на конвертацию. После обработки будет залит на CDN.",
          });
          setDialogOpen(false);
          setFormData({ groupIds: [], name: "", url: "", file: null });
          fetchMedia();
        } else if (response.status === 503) {
          // Превышен лимит обработки или слишком много неготовых файлов
          const error = await response.json();
          const errorMessage = error.message || "Сервис временно недоступен";
          
          // Проверяем, является ли это ошибкой про превышение 5GB неготовых файлов
          const errorLower = errorMessage.toLowerCase();
          const isHeavyFilesError = 
            (errorLower.includes("5") || errorLower.includes("5.00")) && 
            (errorLower.includes("гб") || 
             errorLower.includes("gb") ||
             errorLower.includes("не готов") ||
             errorLower.includes("неготов") ||
             errorLower.includes("сумма") ||
             errorLower.includes("суммар") ||
             errorLower.includes("всего"));
          
          toast({
            title: isHeavyFilesError 
              ? "Превышен лимит неготовых файлов" 
              : "Превышен лимит обработки",
            description: errorMessage,
            variant: "destructive",
          });
        } else if (response.status === 400) {
          // Ошибка валидации
          const error = await response.json();
          const errorMessage = Array.isArray(error.message) 
            ? error.message.join(", ") 
            : error.message || "Ошибка валидации";
          
          toast({
            title: "Ошибка валидации",
            description: errorMessage,
            variant: "destructive",
          });
        } else if (response.status === 401) {
          toast({
            title: "Ошибка авторизации",
            description: "Требуется повторный вход",
            variant: "destructive",
          });
        } else {
          // Другие ошибки
          const error = await response.json().catch(() => ({ message: "Не удалось загрузить медиа" }));
          toast({
            title: "Ошибка",
            description: error.message || "Не удалось загрузить медиа",
            variant: "destructive",
          });
        }
      } else if (uploadMode === "url") {
        if (editingId) {
          const response = await fetch(
            apiUrl(`media/${editingId}`),
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                groupIds: formData.groupIds,
                url: formData.url,
                name: formData.name || null,
              }),
            }
          );

          if (response.ok) {
            toast({
              title: "Успешно",
              description: "Медиа обновлено",
            });
            setDialogOpen(false);
            setFormData({ groupIds: [], name: "", url: "", file: null });
            setEditingId(null);
            fetchMedia();
          } else {
            const error = await response.json().catch(() => ({ message: "Не удалось обновить медиа" }));
            toast({
              title: "Ошибка",
              description: error.message || "Не удалось обновить медиа",
              variant: "destructive",
            });
          }
        } else {
          const response = await fetch(apiUrl("media"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              groupIds: formData.groupIds,
              url: formData.url,
              name: formData.name || null,
            }),
          });

          if (response.ok) {
            toast({
              title: "Успешно",
              description: "Медиа создано",
            });
            setDialogOpen(false);
            setFormData({ groupIds: [], name: "", url: "", file: null });
            fetchMedia();
          } else {
            const error = await response.json().catch(() => ({ message: "Не удалось создать медиа" }));
            toast({
              title: "Ошибка",
              description: error.message || "Не удалось создать медиа",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving media:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении медиа",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот медиафайл?")) return;

    try {
      const response = await fetch(apiUrl(`media/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Медиа удалено",
        });
        fetchMedia();
      } else {
        const error = await response.json().catch(() => ({ message: "Не удалось удалить медиа" }));
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось удалить медиа",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении медиа",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: Media) => {
    // Если есть groupIds, используем их, иначе используем groupId (для обратной совместимости)
    const itemGroupIds = item.groupIds || (item.groupId ? [item.groupId] : []);
    setFormData({
      groupIds: itemGroupIds,
      name: item.name || "",
      url: item.url || "",
      file: null,
    });
    setEditingId(item.id);
    setUploadMode("url");
    setDialogOpen(true);
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData((prev) => {
      if (prev.groupIds.includes(groupId)) {
        return {
          ...prev,
          groupIds: prev.groupIds.filter((id) => id !== groupId),
        };
      } else {
        return {
          ...prev,
          groupIds: [...prev.groupIds, groupId],
        };
      }
    });
  };

  const getGroupName = (id: string) => {
    return groups.find((g) => g.id === id)?.name || "Неизвестно";
  };

  const getGroupNames = (item: Media) => {
    // Если есть groupIds, используем их, иначе используем groupId (для обратной совместимости)
    const itemGroupIds = item.groupIds || (item.groupId ? [item.groupId] : []);
    if (itemGroupIds.length === 0) return "Не назначено";
    return itemGroupIds.map((id) => getGroupName(id)).join(", ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READY":
        return "bg-green-500/20 text-green-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400";
      case "FAILED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Медиа</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ groupIds: [], name: "", url: "", file: null });
                setEditingId(null);
                setUploadMode("upload");
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={18} className="mr-2" />
              Добавить медиа
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? "Редактировать медиа" : "Добавить медиа"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-foreground text-sm block mb-2">
                  Группы (можно выбрать несколько)
                </label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-md p-3 bg-secondary space-y-2">
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Группы не найдены. Создайте группы в разделе "Группы".
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={formData.groupIds.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <label
                          htmlFor={`group-${group.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground flex items-center gap-2"
                        >
                          {group.name}
                          {!group.enabled && (
                            <span className="text-xs text-muted-foreground">
                              (отключена)
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="text-foreground text-sm block mb-2">
                  Название (необязательно)
                </label>
                <Input
                  type="text"
                  placeholder="Название медиа"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                  }}
                  className="w-full"
                  autoComplete="off"
                />
              </div>

              {!editingId && (
                <Tabs
                  value={uploadMode}
                  onValueChange={(v: any) => setUploadMode(v)}
                >
                  <TabsList className="grid w-full grid-cols-2 bg-secondary">
                    <TabsTrigger value="upload">Загрузить файл</TabsTrigger>
                    <TabsTrigger value="url">По URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="space-y-2">
                    <label className="text-foreground text-sm block">
                      Видеофайл
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          file: e.target.files?.[0] || null,
                        })
                      }
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground"
                    />
                  </TabsContent>
                  <TabsContent value="url" className="space-y-2">
                    <label className="text-foreground text-sm block">
                      URL видео
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/video.mp4"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                      }}
                      className="w-full"
                      autoComplete="off"
                    />
                  </TabsContent>
                </Tabs>
              )}

              {editingId && (
                <div>
                  <label className="text-foreground text-sm block mb-2">
                    URL видео
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              )}

              <Button
                onClick={handleSave}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editingId ? "Сохранить изменения" : "Создать медиа"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Загрузка медиа...</div>
      ) : media.length === 0 ? (
        <Card className="p-8 text-center bg-card border-border">
          <p className="text-muted-foreground">
            Медиафайлы не найдены. Добавьте первый файл.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {media.map((item) => (
            <Card
              key={item.id}
              className="p-4 bg-card border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {item.name || "Без названия"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status === "READY"
                        ? "Готово"
                        : item.status === "PENDING"
                        ? "Ожидание"
                        : item.status === "FAILED"
                        ? "Ошибка"
                        : item.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Группы: {getGroupNames(item)}
                  </p>
                  {item.url && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {item.url}
                    </p>
                  )}
                  {item.processingError && (
                    <p className="text-xs text-destructive mt-1">
                      {item.processingError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    className="text-foreground hover:bg-primary/20"
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
