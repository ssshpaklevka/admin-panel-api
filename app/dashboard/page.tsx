"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor, FolderOpen, Film } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface DashboardStats {
  devices: number;
  groups: number;
  media: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("adminToken");
      try {
        const [devicesRes, groupsRes, mediaRes] = await Promise.all([
          fetch(apiUrl("device"), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(apiUrl("group"), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(apiUrl("media"), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const devices = devicesRes.ok ? await devicesRes.json() : [];
        const groups = groupsRes.ok ? await groupsRes.json() : [];
        const media = mediaRes.ok ? await mediaRes.json() : [];

        setStats({
          devices: devices.length,
          groups: groups.length,
          media: media.length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Устройства",
      value: stats?.devices ?? 0,
      icon: Monitor,
      color: "text-blue-400",
    },
    {
      title: "Группы",
      value: stats?.groups ?? 0,
      icon: FolderOpen,
      color: "text-purple-400",
    },
    {
      title: "Медиафайлы",
      value: stats?.media ?? 0,
      icon: Film,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Панель управления
        </h1>
        <p className="text-muted-foreground">
          Система управления медиаконтентом
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="p-6 bg-card border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{card.title}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-20 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {card.value}
                    </p>
                  )}
                </div>
                <Icon className={`${card.color} size-10 opacity-20`} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard/devices"
            className="p-4 rounded-lg bg-secondary border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <h3 className="font-semibold text-foreground">
              Управление устройствами
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Добавление, редактирование и удаление медиаплееров
            </p>
          </a>
          <a
            href="/dashboard/groups"
            className="p-4 rounded-lg bg-secondary border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <h3 className="font-semibold text-foreground">
              Управление группами
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Создание и организация групп устройств
            </p>
          </a>
          <a
            href="/dashboard/media"
            className="p-4 rounded-lg bg-secondary border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <h3 className="font-semibold text-foreground">Загрузка медиа</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Добавление видео и управление контентом
            </p>
          </a>
        </div>
      </Card>
    </div>
  );
}
