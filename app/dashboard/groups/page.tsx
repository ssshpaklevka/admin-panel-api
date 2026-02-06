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
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Group {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    enabled: true,
  });

  const token = localStorage.getItem("adminToken");

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
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Введите название группы");
      return;
    }

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? apiUrl(`group/${editingId}`)
        : apiUrl("group");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        setFormData({ name: "", enabled: true });
        setEditingId(null);
        fetchGroups();
      } else {
        alert("Не удалось сохранить группу");
      }
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту группу?")) return;

    try {
      const response = await fetch(apiUrl(`group/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const handleEdit = (group: Group) => {
    setFormData({
      name: group.name,
      enabled: group.enabled,
    });
    setEditingId(group.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Группы</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ name: "", enabled: true });
                setEditingId(null);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={18} className="mr-2" />
              Добавить группу
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? "Редактировать группу" : "Добавить группу"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название группы"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between">
                <label className="text-foreground">Включено</label>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
              </div>
              <Button
                onClick={handleSave}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editingId ? "Сохранить изменения" : "Создать группу"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Загрузка групп...</div>
      ) : groups.length === 0 ? (
        <Card className="p-8 text-center bg-card border-border">
          <p className="text-muted-foreground">
            Группы не найдены. Создайте первую группу.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="p-4 bg-card border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {group.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        group.enabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {group.enabled ? "Включено" : "Выключено"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Создано:{" "}
                    {new Date(group.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(group)}
                    className="text-foreground hover:bg-primary/20"
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(group.id)}
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
