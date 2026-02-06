/**
 * Получить базовый URL API
 * Использует переменную окружения NEXT_PUBLIC_API_URL или дефолтное значение
 */
export function getApiUrl(): string {
  // В Next.js переменные окружения с префиксом NEXT_PUBLIC_ доступны на клиенте
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
}

/**
 * Создать полный URL для API эндпоинта
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiUrl();
  // Убираем ведущий слэш из path, если есть
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
}
