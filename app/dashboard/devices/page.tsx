"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Device {
  id: string;
  macAddress: string;
  ip: string;
  name: string | null;
  location: string | null;
  groups: Array<{ id: string; name: string; enabled: boolean }>;
  lastSeen: string | null;
}

interface Group {
  id: string;
  name: string;
  enabled: boolean;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    macAddress: "",
    ip: "",
    name: "",
    location: "",
    groupId: "",
  });

  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const fetchDevices = async () => {
    try {
      const response = await fetch(apiUrl("device"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
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
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchGroups();
  }, []);

  // Сброс формы при закрытии диалога
  useEffect(() => {
    if (!dialogOpen) {
      // Небольшая задержка, чтобы анимация закрытия завершилась
      setTimeout(() => {
        setFormData({ macAddress: "", ip: "", name: "", location: "", groupId: "" });
        setEditingId(null);
      }, 200);
    }
  }, [dialogOpen]);

  const handleSave = async () => {
    if (
      !formData.macAddress ||
      !formData.ip ||
      !formData.name ||
      !formData.location
    ) {
      toast({
        title: "Ошибка",
        description: "Все поля обязательны для заполнения",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? apiUrl(`device/${editingId}`)
        : apiUrl("device");

      const requestBody: any = {
        macAddress: formData.macAddress,
        ip: formData.ip,
        name: formData.name,
        location: formData.location,
      };

      // Добавляем groupId (даже если пустой, чтобы можно было удалить группу)
      if (editingId) {
        // При редактировании всегда отправляем groupId
        requestBody.groupId = formData.groupId || null;
      } else {
        // При создании отправляем только если выбрана
        if (formData.groupId) {
          requestBody.groupId = formData.groupId;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: editingId ? "Устройство обновлено" : "Устройство создано",
        });
        setDialogOpen(false);
        setFormData({ macAddress: "", ip: "", name: "", location: "", groupId: "" });
        setEditingId(null);
        fetchDevices();
      } else {
        const error = await response.json().catch(() => ({ message: "Не удалось сохранить устройство" }));
        const errorMessage = Array.isArray(error.message) 
          ? error.message.join(", ") 
          : error.message || "Не удалось сохранить устройство";
        toast({
          title: "Ошибка",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving device:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении устройства",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это устройство?")) return;

    try {
      const response = await fetch(apiUrl(`device/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Устройство удалено",
        });
        fetchDevices();
      } else {
        const error = await response.json().catch(() => ({ message: "Не удалось удалить устройство" }));
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось удалить устройство",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении устройства",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (device: Device) => {
    console.log("Editing device:", device); // для отладки
    setFormData({
      macAddress: device.macAddress,
      ip: device.ip,
      name: device.name || "",
      location: device.location || "",
      groupId: device.groups && device.groups.length > 0 ? device.groups[0].id : "",
    });
    setEditingId(device.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Устройства</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ macAddress: "", ip: "", name: "", location: "", groupId: "" });
                setEditingId(null);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={18} className="mr-2" />
              Добавить устройство
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? "Редактировать устройство" : "Добавить устройство"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-foreground text-sm block mb-2">
                  MAC-адрес
                </label>
                <Input
                  type="text"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  value={formData.macAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, macAddress: e.target.value })
                  }
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                  }}
                />
              </div>
              <div>
                <label className="text-foreground text-sm block mb-2">
                  IP-адрес
                </label>
                <Input
                  type="text"
                  placeholder="192.168.1.100"
                  value={formData.ip}
                  onChange={(e) =>
                    setFormData({ ...formData, ip: e.target.value })
                  }
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                  }}
                />
              </div>
              <div>
                <label className="text-foreground text-sm block mb-2">
                  Название устройства
                </label>
                <Input
                  type="text"
                  placeholder="Название устройства"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                  }}
                />
              </div>
              <div>
                <label className="text-foreground text-sm block mb-2">
                  Расположение
                </label>
                <Input
                  type="text"
                  placeholder="Расположение"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                  }}
                />
              </div>
              <div>
                <label className="text-foreground text-sm block mb-2">
                  Группа
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => {
                    console.log("Group selected:", e.target.value); // для отладки
                    setFormData({ ...formData, groupId: e.target.value });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground cursor-pointer"
                >
                  <option value="">Выберите группу...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} {!group.enabled && "(отключена)"}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleSave}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editingId ? "Сохранить изменения" : "Создать устройство"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Загрузка устройств...</div>
      ) : devices.length === 0 ? (
        <Card className="p-8 text-center bg-card border-border">
          <p className="text-muted-foreground">
            Устройства не найдены. Добавьте первое устройство.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <Card
              key={device.id}
              className="p-4 bg-card border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {device.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {device.macAddress}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {device.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    IP: {device.ip}
                  </p>
                  {device.groups && device.groups.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {device.groups.map((group) => (
                        <span
                          key={group.id}
                          className="px-2 py-1 text-xs bg-primary/20 text-primary rounded"
                        >
                          {group.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Edit button clicked for device:", device.id);
                      handleEdit(device);
                    }}
                    className="text-foreground hover:bg-primary/20"
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(device.id)}
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
